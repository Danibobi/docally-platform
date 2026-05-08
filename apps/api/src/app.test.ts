import {afterEach, describe, expect, it, vi} from "vitest";
import {demoApiKey} from "./auth";
import {createApp} from "./app";

const fixtureHtml = `<!doctype html>
<html>
  <head>
    <style>
      .hero-text { color: #aaaaaa; }
      .hero-banner { animation: slide 3s infinite; }
      @keyframes slide { from { opacity: 0; } to { opacity: 1; } }
    </style>
  </head>
  <body>
    <h1 class="headline" style="color: #aaaaaa">Welcome</h1>
    <h3>Skipped heading</h3>
    <img src="/hero.png">
    <button></button>
    <input id="email">
    <p class="hero-text">Our revolutionary platform leverages cutting-edge AI to deliver unprecedented value across complex enterprise workflows that are difficult for many people to understand quickly while responsibilities are being assigned across departments without direct ownership.</p>
    <main id="main">
      <p>This paragraph exists to make the page look like real static content with enough text that Playwright is not needed for the test fixture.</p>
      <p>This paragraph exists to make the page look like real static content with enough text that Playwright is not needed for the test fixture.</p>
      <p>This paragraph exists to make the page look like real static content with enough text that Playwright is not needed for the test fixture.</p>
    </main>
  </body>
</html>`;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DocAlly developer API", () => {
  it("rejects missing API keys", async () => {
    const app = createApp();
    const response = await app.request("/v1/scan", {
      method: "POST",
      body: JSON.stringify({url: "https://example.com", profile: "all"}),
      headers: {"content-type": "application/json"},
    });

    expect(response.status).toBe(401);
  });

  it("validates scan payloads", async () => {
    const app = createApp();
    const response = await app.request("/v1/scan", {
      method: "POST",
      body: JSON.stringify({url: "not-a-url", profile: "all"}),
      headers: {
        authorization: `Bearer ${demoApiKey}`,
        "content-type": "application/json",
      },
    });

    expect(response.status).toBe(400);
  });

  it("scans static HTML and returns grouped accessibility issues", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(fixtureHtml, {status: 200, headers: {"content-type": "text/html"}})),
    );
    const app = createApp();

    const response = await app.request("/v1/scan", {
      method: "POST",
      body: JSON.stringify({url: "https://example.com", profile: "all"}),
      headers: {
        authorization: `Bearer ${demoApiKey}`,
        "content-type": "application/json",
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.scan_id).toMatch(/^scan_/);
    expect(data.issues.map((issue: {type: string}) => issue.type)).toEqual(
      expect.arrayContaining([
        "missing_lang",
        "missing_alt_text",
        "missing_aria_label",
        "form_input_label",
        "heading_hierarchy",
        "contrast_ratio",
        "animation_present",
        "language_complexity",
      ]),
    );
    expect(data.summary.total).toBeGreaterThan(6);
  });

  it("generates fixes for selected scan issue IDs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(fixtureHtml, {status: 200, headers: {"content-type": "text/html"}})),
    );
    const app = createApp();

    const scanResponse = await app.request("/v1/scan", {
      method: "POST",
      body: JSON.stringify({url: "https://example.com", profile: "all"}),
      headers: {
        authorization: `Bearer ${demoApiKey}`,
        "content-type": "application/json",
      },
    });
    const scan = await scanResponse.json();

    const fixResponse = await app.request("/v1/fix", {
      method: "POST",
      body: JSON.stringify({scan_id: scan.scan_id, issue_ids: [scan.issues[0].id], profile: "all"}),
      headers: {
        authorization: `Bearer ${demoApiKey}`,
        "content-type": "application/json",
      },
    });

    expect(fixResponse.status).toBe(200);
    const fixes = await fixResponse.json();
    expect(fixes.fixes).toHaveLength(1);
    expect(fixes.fixes[0]).toHaveProperty("fixed");
    expect(fixes.fixes[0]).toHaveProperty("explanation");
  });

  it("returns not found for unknown scan IDs", async () => {
    const app = createApp();
    const response = await app.request("/v1/fix", {
      method: "POST",
      body: JSON.stringify({scan_id: "scan_missing", issue_ids: ["issue_001"], profile: "all"}),
      headers: {
        authorization: `Bearer ${demoApiKey}`,
        "content-type": "application/json",
      },
    });

    expect(response.status).toBe(404);
  });

  it("stores explicit preference events without changing scan behavior", async () => {
    const app = createApp();
    const response = await app.request("/v1/preferences/events", {
      method: "POST",
      body: JSON.stringify({
        preference_key: "communication_depth",
        value: "concise",
        signal: "explicit",
        context: {surface: "dashboard", workflow: "preference_inspector"},
      }),
      headers: {
        authorization: `Bearer ${demoApiKey}`,
        "content-type": "application/json",
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.event_id).toMatch(/^pref_evt_/);
    expect(data.preference.confidence).toBeGreaterThanOrEqual(0.95);
    expect(data.state.safety_policy.no_diagnosis_inference).toBe(true);
  });

  it("keeps weak preference events below automatic adaptation threshold", async () => {
    const app = createApp();
    const response = await app.request("/v1/preferences/events", {
      method: "POST",
      body: JSON.stringify({
        preference_key: "alert_frequency",
        value: "fewer_alerts",
        signal: "weak",
        context: {surface: "dashboard", workflow: "dismissed_banner"},
      }),
      headers: {
        authorization: `Bearer ${demoApiKey}`,
        "content-type": "application/json",
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.preference.confidence).toBeLessThan(0.7);
    expect(data.state.adaptation_allowed).toBe(false);
  });

  it("lets users inspect, edit, and undo preference state", async () => {
    const app = createApp();
    const patchResponse = await app.request("/v1/preferences/state", {
      method: "PATCH",
      body: JSON.stringify({
        preferences: [
          {
            preference_key: "language_literalness",
            value: "literal",
            context: {surface: "dashboard", workflow: "preference_inspector"},
          },
        ],
      }),
      headers: {
        authorization: `Bearer ${demoApiKey}`,
        "content-type": "application/json",
      },
    });

    expect(patchResponse.status).toBe(200);
    const patched = await patchResponse.json();
    expect(patched.preferences[0].value).toBe("literal");

    const undoResponse = await app.request("/v1/preferences/state", {
      method: "PATCH",
      body: JSON.stringify({undo_preference_keys: ["language_literalness"]}),
      headers: {
        authorization: `Bearer ${demoApiKey}`,
        "content-type": "application/json",
      },
    });
    const undone = await undoResponse.json();
    expect(undone.preferences).toHaveLength(0);
  });

  it("records approved weak signals through a dedicated endpoint", async () => {
    const app = createApp();
    const response = await app.request("/v1/preferences/weak-signals", {
      method: "POST",
      body: JSON.stringify({
        event: "fix_explanation_collapsed",
        context: {
          surface: "dashboard",
          issueType: "language_complexity",
          sessionDepth: 2,
          timeOnStep: 9,
        },
      }),
      headers: {
        authorization: `Bearer ${demoApiKey}`,
        "content-type": "application/json",
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.preference.preference_key).toBe("communication_depth");
    expect(data.preference.value).toBe("concise");
    expect(data.preference.confidence).toBeLessThan(0.7);
  });

  it("rejects unknown weak signal events", async () => {
    const app = createApp();
    const response = await app.request("/v1/preferences/weak-signals", {
      method: "POST",
      body: JSON.stringify({
        event: "mouse_moved",
        context: {surface: "dashboard", sessionDepth: 1, timeOnStep: 1},
      }),
      headers: {
        authorization: `Bearer ${demoApiKey}`,
        "content-type": "application/json",
      },
    });

    expect(response.status).toBe(400);
  });
});
