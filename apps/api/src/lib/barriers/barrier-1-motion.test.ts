import {describe, expect, it} from "vitest";
import {detectMotionBarriers} from "./barrier-1-motion";

const html = `
  <main>
    <video autoplay src="intro.mp4"></video>
    <audio autoplay src="alert.mp3"></audio>
  </main>
`;

const css = `
  @keyframes pulse {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .hero {
    animation: pulse 2s infinite;
  }

  .card {
    animation-name: pulse;
    animation-duration: 4s;
    animation-iteration-count: infinite;
  }

  .button {
    transition: all 250ms ease;
  }

  @media (prefers-reduced-motion: no-preference) {
    @keyframes safeFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .safe {
      animation: safeFade 200ms ease;
    }
  }
`;

describe("detectMotionBarriers", () => {
  it("detects all Task 1 motion and autoplay patterns", () => {
    const issues = detectMotionBarriers(html, css);

    expect(issues).toHaveLength(4);
    expect(issues.every((issue) => issue.barrier === 1)).toBe(true);
    expect(issues.map((issue) => issue.type)).toEqual(
      expect.arrayContaining([
        "motion_css_animation_without_preference",
        "motion_autoplay_video_without_controls",
        "motion_autoplay_audio_without_controls",
        "motion_css_transition_without_preference",
      ]),
    );
  });

  it("groups duplicate animation use by animation name and includes A/B/C fix options", () => {
    const issue = detectMotionBarriers(html, css).find((item) => item.type === "motion_css_animation_without_preference");

    expect(issue).toBeDefined();
    expect(issue?.severity).toBe("critical");
    expect(issue?.fix_type).toBe("css_global");
    expect(issue?.affectedCount).toBe(2);
    expect(issue?.description).toContain("pulse");
    expect(issue?.fix_after).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(issue?.fixOptions?.map((option) => option.option)).toEqual(["A", "B", "C"]);
    expect(issue?.fixOptions?.[1].fix_after).toContain("0.3s");
    expect(issue?.fixOptions?.[1].fix_after).not.toContain("infinite");
    expect(issue?.fixOptions?.[2].fix_after).not.toMatch(/animation\s*:/i);
  });

  it("adds safe video attributes without removing autoplay", () => {
    const issue = detectMotionBarriers(html, css).find((item) => item.type === "motion_autoplay_video_without_controls");

    expect(issue?.severity).toBe("high");
    expect(issue?.fix_type).toBe("html_attribute");
    expect(issue?.fix_before).toContain("<video autoplay");
    expect(issue?.fix_after).toContain("autoplay");
    expect(issue?.fix_after).toContain("muted");
    expect(issue?.fix_after).toContain("controls");
    expect(issue?.fix_after).toContain("playsinline");
  });

  it("removes audio autoplay and adds controls", () => {
    const issue = detectMotionBarriers(html, css).find((item) => item.type === "motion_autoplay_audio_without_controls");

    expect(issue?.severity).toBe("critical");
    expect(issue?.fix_type).toBe("html_attribute");
    expect(issue?.fix_before).toContain("<audio autoplay");
    expect(issue?.fix_after).not.toContain("autoplay");
    expect(issue?.fix_after).toContain("controls");
  });

  it("flags unsafe transitions and ignores safe reduced-motion blocks", () => {
    const issues = detectMotionBarriers(html, css);
    const transitionIssue = issues.find((item) => item.type === "motion_css_transition_without_preference");

    expect(transitionIssue?.severity).toBe("medium");
    expect(transitionIssue?.fix_type).toBe("css_global");
    expect(transitionIssue?.fix_after).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(issues.some((issue) => issue.fix_before.includes("safeFade"))).toBe(false);
  });
});
