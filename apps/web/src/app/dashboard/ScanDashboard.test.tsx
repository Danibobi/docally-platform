import {cleanup, render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {afterEach, describe, expect, it, vi} from "vitest";
import {ScanDashboard, type BarrierScanResult} from "./ScanDashboard";

vi.mock("next/font/google", () => {
  const font = () => ({className: "font", style: {fontFamily: "test-font"}});
  return {
    Geist: font,
    Instrument_Serif: font,
    JetBrains_Mono: font,
  };
});

afterEach(() => {
  cleanup();
});

const result: BarrierScanResult = {
  score: 58,
  totalIssues: 12,
  estimatedFixTime: "~45 minutes",
  summary: {critical: 1, high: 4, medium: 6, low: 1, fixable: 10, total: 12},
  topFixes: [
    {
      id: "issue_001",
      barrier: 1,
      severity: "critical",
      type: "animation_present",
      element: ".hero",
      description: "CSS animation runs without reduced-motion support.",
      plain_english: "Hero animation may distract users.",
      wcag_ref: "2.3.3",
      fix_type: "css_global",
      fix_before: ".hero { animation: slide 3s infinite; }",
      fix_after: "@media (prefers-reduced-motion: no-preference) { .hero { animation: slide 3s infinite; } }",
      users_affected: "Users who prefer a calmer reading experience",
      affected_count: 3,
      fixOptions: {A: "Safest", B: "Reduced", C: "Remove"},
    },
    {
      id: "issue_002",
      barrier: 3,
      severity: "high",
      type: "vague_cta",
      element: ".cta",
      description: "Button copy is vague.",
      plain_english: "Button label is not explicit.",
      wcag_ref: "2.4.6",
      fix_type: "ai_rewrite",
      fix_before: "Learn more",
      fix_after: "View pricing plans",
      users_affected: "Users who prefer literal labels",
      affected_count: 2,
      fixOptions: {A: "Explicit label", B: "ARIA label", C: "Tooltip"},
    },
  ],
  issuesByBarrier: {
    barrier1: [],
    barrier2: [],
    barrier3: [],
    barrier4: [],
    barrier5: [],
    barrier6: [],
  },
};

result.issuesByBarrier.barrier1 = [result.topFixes[0]];
result.issuesByBarrier.barrier3 = [result.topFixes[1]];

describe("ScanDashboard solution-first result flow", () => {
  it("renders the scan result summary with a circular score label", () => {
    render(<ScanDashboard url="https://example.com" result={result} onNewScan={vi.fn()} />);

    expect(screen.getByText("A calmer website is possible without a rebuild.")).toBeTruthy();
    expect(screen.getByRole("img", {name: "Normalized clarity score: 58 out of 100"})).toBeTruthy();
    expect(screen.getByText("This score reflects issue severity, user impact, and page coverage — not just total findings.")).toBeTruthy();
    expect(screen.getByText("Recommended next step")).toBeTruthy();
    expect(screen.getByRole("heading", {name: "Preview Focus Mode"})).toBeTruthy();
    expect(screen.getByRole("button", {name: "Apply Focus Mode"})).toBeTruthy();
  });

  it("renders Overview as aligned issue widgets with a Focus Mode preview", async () => {
    const user = userEvent.setup();
    render(<ScanDashboard url="https://example.com" result={result} onNewScan={vi.fn()} />);

    expect(screen.getByRole("heading", {name: "What needs attention first"})).toBeTruthy();
    expect(screen.getByRole("heading", {name: "Visual overload"})).toBeTruthy();
    expect(screen.getAllByText("High impact").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Focus Mode helps").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", {name: "Highlight areas"})).toBeTruthy();
    expect(screen.getByText("Focus Mode preview")).toBeTruthy();
    expect(screen.getByText("Promo banner")).toBeTruthy();
    expect(screen.getByText("Focus Mode reduces visual clutter and creates a calmer browsing layer before committing to a full rebuild.")).toBeTruthy();

    await user.click(screen.getByRole("button", {name: "Preview fix"}));
    expect(screen.getByText("Animated carousel").className).toContain("is-highlighted");
  });

  it("keeps technical details out of the default view and shows them from the tab", async () => {
    const user = userEvent.setup();
    render(<ScanDashboard url="https://example.com" result={result} onNewScan={vi.fn()} />);

    expect(screen.queryByText("Code-level findings")).toBeNull();
    await user.click(screen.getByRole("button", {name: "Technical Details"}));
    expect(screen.getByText("Code-level findings")).toBeTruthy();
  });

  it("opens Issues to the strict table with header, tabs, and grouped rows", async () => {
    const user = userEvent.setup();
    render(<ScanDashboard url="https://example.com" result={result} onNewScan={vi.fn()} />);

    await user.click(screen.getByRole("button", {name: "Issues"}));

    expect(screen.getByText("ALL ISSUES")).toBeTruthy();
    expect(screen.getByText("2 issues")).toBeTruthy();
    expect(screen.getByRole("button", {name: "All 2"})).toBeTruthy();
    expect(screen.getByRole("button", {name: "Critical 1"})).toBeTruthy();
    expect(screen.getByRole("button", {name: "High 1"})).toBeTruthy();
    expect(screen.getByText("SEVERITY")).toBeTruthy();
    expect(screen.getByText("ISSUE")).toBeTruthy();
    expect(screen.getByText("BARRIER")).toBeTruthy();
    expect(screen.getByText("SIZE")).toBeTruthy();
    expect(screen.getByText("ELEMENTS")).toBeTruthy();
    expect(screen.getAllByText("WCAG").length).toBeGreaterThan(0);
    expect(screen.getByText("FINE")).toBeTruthy();
    expect(screen.getByText("MOTION")).toBeTruthy();
    expect(screen.getByText("LANGUAGE")).toBeTruthy();
    expect(screen.getAllByText("MINIMAL").length).toBeGreaterThan(0);
    expect(screen.getByText("€80K-500K")).toBeTruthy();
    expect(screen.getByText("€20K-80K")).toBeTruthy();
  });

  it("filters issue rows by severity and shows empty states", async () => {
    const user = userEvent.setup();
    render(<ScanDashboard url="https://example.com" result={result} onNewScan={vi.fn()} />);

    await user.click(screen.getByRole("button", {name: "Issues"}));
    await user.click(screen.getByRole("button", {name: "Critical 1"}));
    expect(screen.getByText("Hero animation may distract users.")).toBeTruthy();
    expect(screen.queryByText("Button label is not explicit.")).toBeNull();

    await user.click(screen.getByRole("button", {name: "Medium 0"}));
    expect(screen.getByText("No medium issues found")).toBeTruthy();
  });

  it("selects an issue row and carries that selection into the existing technical panel", async () => {
    const user = userEvent.setup();
    render(<ScanDashboard url="https://example.com" result={result} onNewScan={vi.fn()} />);

    await user.click(screen.getByRole("button", {name: "Issues"}));
    await user.click(screen.getByText("Button label is not explicit."));
    await user.click(screen.getByRole("button", {name: "Technical Details"}));

    expect(screen.getByRole("heading", {name: "Button label is not explicit."})).toBeTruthy();
  });

  it("renders fixed issues with fixed styling and empty copy when none exist", async () => {
    const user = userEvent.setup();
    const fixedResult: BarrierScanResult = {
      ...result,
      topFixes: [{...result.topFixes[0], status: "fixed", resolved_at: "2026-05-08T20:00:00.000Z"}],
      issuesByBarrier: {
        ...result.issuesByBarrier,
        barrier1: [{...result.topFixes[0], status: "fixed", resolved_at: "2026-05-08T20:00:00.000Z"}],
        barrier3: [result.topFixes[1]],
      },
    };
    render(<ScanDashboard url="https://example.com" result={fixedResult} onNewScan={vi.fn()} />);

    await user.click(screen.getByRole("button", {name: "Issues"}));
    await user.click(screen.getByRole("button", {name: "Fixed 1"}));

    expect(screen.getByText("Fixed ✓")).toBeTruthy();
    expect(screen.getByText("Hero animation may distract users.")).toBeTruthy();
  });

  it("opens the full-screen guided flow and progresses to the recommendation", async () => {
    const user = userEvent.setup();
    render(<ScanDashboard url="https://example.com" result={result} onNewScan={vi.fn()} />);

    await user.click(screen.getByRole("button", {name: "Apply Focus Mode"}));
    expect(screen.getByRole("dialog", {name: "What type of website is this?"})).toBeTruthy();
    await user.click(screen.getByRole("button", {name: "SaaS / Product"}));
    await user.click(screen.getByRole("button", {name: "Reading is hard"}));
    await user.click(screen.getByRole("button", {name: "51-200"}));

    expect(screen.getByText("Recommended solution: Focus Mode layer")).toBeTruthy();
  });

  it("toggles Focus Mode preview and changes preview zoom in the guided flow", async () => {
    const user = userEvent.setup();
    render(<ScanDashboard url="https://example.com" result={result} onNewScan={vi.fn()} />);

    await user.click(screen.getByRole("button", {name: "Apply Focus Mode"}));
    await user.click(screen.getByRole("button", {name: "SaaS / Product"}));
    await user.click(screen.getByRole("button", {name: "Reading is hard"}));
    await user.click(screen.getByRole("button", {name: "51-200"}));

    await user.click(screen.getByRole("switch", {name: "Focus Mode"}));
    expect(screen.getByText("Focus Mode enabled. Visual noise reduced, animations removed, and reading clarity improved.")).toBeTruthy();

    await user.click(screen.getByRole("button", {name: "Zoom in"}));
    expect(screen.getByText("110%")).toBeTruthy();
  });

  it("opens the placeholder booking modal from the final guided step", async () => {
    const user = userEvent.setup();
    render(<ScanDashboard url="https://example.com" result={result} onNewScan={vi.fn()} />);

    await user.click(screen.getByRole("button", {name: "Apply Focus Mode"}));
    await user.click(screen.getByRole("button", {name: "SaaS / Product"}));
    await user.click(screen.getByRole("button", {name: "Reading is hard"}));
    await user.click(screen.getByRole("button", {name: "51-200"}));
    await user.click(screen.getByRole("button", {name: "Book a Call with Us"}));

    expect(screen.getByRole("dialog", {name: "Book a DocAlly Demo"})).toBeTruthy();
    expect(screen.getByText("Calendar integration coming soon.")).toBeTruthy();
  });
});
