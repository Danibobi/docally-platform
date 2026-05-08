"use client";

import {FormEvent, useMemo, useState} from "react";
import {Geist, Instrument_Serif, JetBrains_Mono} from "next/font/google";
import {Globe} from "lucide-react";
import {ScanDashboard, type BarrierScanResult} from "./ScanDashboard";
import {normalizeScanUrl} from "./url";

const instrument = Instrument_Serif({subsets: ["latin"], weight: "400"});
const geist = Geist({subsets: ["latin"], weight: ["400", "500"]});
const mono = JetBrains_Mono({subsets: ["latin"], weight: ["400", "500"]});

type ScanState = "idle" | "scanning" | "done";
type ScanType = "quick" | "full";

const apiBase = process.env.NEXT_PUBLIC_DOCALLY_API_URL || "http://localhost:8787";
const apiKey = process.env.NEXT_PUBLIC_DOCALLY_DEMO_API_KEY || "dk_test_docally_demo_key";
const examples = ["apple.com", "bmw.com", "pwc.com"];

const progressLines = [
  ["Fetching page...", "#888580"],
  ["Running Barrier 1: Motion", "#888580"],
  ["Running Barrier 2: Color", "#888580"],
  ["Running Barrier 3: Language", "#888580"],
  ["Running Barrier 4: Navigation", "#888580"],
  ["Running Barrier 5: Clutter", "#888580"],
  ["Running Barrier 6: Time", "#888580"],
  ["Generating root causes...", "#1E8449"],
  ["Complete. Building report...", "#E8DCC8"],
] as const;

export default function DashboardPage() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  const [scanType, setScanType] = useState<ScanType>("quick");
  const [result, setResult] = useState<BarrierScanResult | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState("");
  const host = useMemo(() => safeHost(submittedUrl || url), [submittedUrl, url]);

  async function submitScan(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const normalized = normalizeScanUrl(url);
    if (!normalized.ok) {
      setError(normalized.error);
      return;
    }

    setError("");
    setSubmittedUrl(normalized.url);
    setScanState("scanning");

    const scanPromise = scanUrl(normalized.url, scanType);
    const delayPromise = new Promise((resolve) => window.setTimeout(resolve, 7000));
    const [scanResult] = await Promise.all([scanPromise, delayPromise]);
    setResult(scanResult.result);
    setDemoMode(scanResult.demoMode);
    setScanState("done");
  }

  function resetScan() {
    setScanState("idle");
    setResult(null);
    setDemoMode(false);
    setError("");
    setSubmittedUrl("");
  }

  if (scanState === "done" && result) {
    return <ScanDashboard url={submittedUrl} result={{...result, demoMode}} onNewScan={resetScan} />;
  }

  return (
    <main className={`${geist.className} dashboard-entry`}>
      <section className="entry-center" aria-live={scanState === "scanning" ? "polite" : "off"}>
        <div className="entry-brand">
          <div className={instrument.className}>DocAlly</div>
          <p>Accessibility intelligence for developers</p>
        </div>

        {scanState === "idle" ? (
          <>
            <h1 className={instrument.className}>What site are we fixing today?</h1>
            <form className="entry-form" onSubmit={submitScan}>
              <div className={`url-bar ${error ? "has-error" : ""}`}>
                <Globe size={16} aria-hidden="true" />
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com"
                  aria-label="URL to scan"
                />
                <div className="scan-toggle" aria-label="Scan type">
                  <button
                    type="button"
                    className={scanType === "quick" ? "is-selected" : ""}
                    onClick={() => setScanType("quick")}
                  >
                    Single page
                  </button>
                  <button
                    type="button"
                    className={scanType === "full" ? "is-selected" : ""}
                    onClick={() => setScanType("full")}
                  >
                    Full site
                  </button>
                </div>
                <button className="scan-submit" type="submit">Scan →</button>
              </div>
              {error ? <p className="entry-error">{error}</p> : null}
            </form>

            <div className="examples">
              <p>Try an example →</p>
              <div>
                {examples.map((example) => (
                  <button key={example} type="button" onClick={() => setUrl(`https://${example}`)}>
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="scanning-url">Scanning {host}...</p>
            <div className={`${mono.className} progress-terminal`}>
              {progressLines.map(([line, color], index) => (
                <div className="progress-line" style={{animationDelay: `${index * 0.8}s`}} key={line}>
                  <span>→ </span>
                  <strong style={{color}}>{line}</strong>
                  {index === progressLines.length - 1 ? <em>|</em> : null}
                </div>
              ))}
            </div>
            <p className="scan-empty-state">Results will appear here after the scan completes.</p>
          </>
        )}
      </section>

      <footer className="entry-footer">
        88% of EU websites fail EAA compliance. Fines up to 4% of annual turnover.
      </footer>

      <style jsx>{`
        .dashboard-entry {
          min-height: 100vh;
          background: #0A0A0A;
          color: #F5F5F0;
          display: grid;
          place-items: center;
          position: relative;
          padding: 32px 20px 72px;
        }

        .entry-center {
          width: min(720px, 100%);
          display: grid;
          justify-items: center;
        }

        .entry-brand {
          display: grid;
          justify-items: center;
          gap: 6px;
          margin-bottom: 64px;
        }

        .entry-brand div {
          font-size: 22px;
          line-height: 1;
          color: #F5F5F0;
        }

        .entry-brand p,
        .scanning-url {
          margin: 0;
          color: #888580;
          font-size: 13px;
        }

        h1 {
          max-width: 620px;
          margin: 0 0 32px;
          color: #F5F5F0;
          font-size: 42px;
          font-weight: 400;
          line-height: 1.2;
          text-align: center;
        }

        .entry-form {
          width: min(560px, 90vw);
        }

        .url-bar {
          width: 100%;
          min-height: 58px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: #111111;
          border: 1px solid #1E1E1E;
          border-radius: 8px;
          transition: border-color 0.15s;
        }

        .url-bar:focus-within {
          border-color: #2A2A2A;
        }

        .url-bar.has-error {
          border-color: #C0392B;
        }

        .url-bar svg {
          flex: 0 0 auto;
          color: #4A4A46;
        }

        input {
          min-width: 0;
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #F5F5F0;
          font: 400 15px/1.2 ${geist.style.fontFamily};
        }

        input::placeholder {
          color: #4A4A46;
        }

        .scan-toggle {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 0 0 auto;
        }

        .scan-toggle button {
          border: none;
          border-radius: 4px;
          background: transparent;
          color: #4A4A46;
          padding: 4px 10px;
          font: 400 12px/1.2 ${geist.style.fontFamily};
          cursor: pointer;
        }

        .scan-toggle button.is-selected {
          background: #1E1E1E;
          color: #F5F5F0;
        }

        .scan-submit {
          flex: 0 0 auto;
          background: #E8DCC8;
          color: #0A0A0A;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font: 500 13px/1.2 ${geist.style.fontFamily};
          cursor: pointer;
          transition: background 0.15s;
        }

        .scan-submit:hover {
          background: #C4B89A;
        }

        .entry-error {
          margin: 10px 0 0;
          color: #C0392B;
          font-size: 12px;
        }

        .examples {
          margin-top: 16px;
          display: grid;
          justify-items: center;
        }

        .examples p {
          margin: 0 0 8px;
          color: #4A4A46;
          font-size: 11px;
        }

        .examples div {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }

        .examples button {
          background: #111111;
          border: 1px solid #1E1E1E;
          border-radius: 4px;
          color: #888580;
          padding: 5px 12px;
          font: 400 12px/1.2 ${geist.style.fontFamily};
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }

        .examples button:hover {
          border-color: #2A2A2A;
          color: #F5F5F0;
        }

        .scanning-url {
          font-size: 14px;
          margin-bottom: 32px;
        }

        .progress-terminal {
          width: min(560px, 90vw);
          background: #111111;
          border: 1px solid #1E1E1E;
          border-radius: 8px;
          padding: 20px 24px;
          font-size: 13px;
          line-height: 1.8;
        }

        .scan-empty-state {
          width: min(560px, 90vw);
          margin: 14px 0 0;
          color: #4A4A46;
          font-size: 12px;
          text-align: center;
        }

        .progress-line {
          opacity: 0;
          transform: translateY(4px);
          animation: reveal-line 0.3s ease forwards;
          white-space: nowrap;
        }

        .progress-line span {
          color: #4A4A46;
        }

        .progress-line strong {
          font-weight: 400;
        }

        .progress-line em {
          color: #E8DCC8;
          font-style: normal;
          animation: blink 1s step-end infinite;
        }

        .entry-footer {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          border-top: 1px solid #1E1E1E;
          padding: 16px;
          color: #4A4A46;
          background: #0A0A0A;
          font-size: 12px;
          text-align: center;
        }

        @keyframes reveal-line {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blink {
          50% {
            opacity: 0;
          }
        }

        @media (max-width: 720px) {
          .url-bar {
            align-items: stretch;
            flex-wrap: wrap;
          }

          input {
            flex-basis: calc(100% - 28px);
          }

          .scan-toggle {
            flex: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .url-bar,
          .scan-submit,
          .examples button {
            transition: none;
          }

          .progress-line {
            opacity: 1;
            transform: none;
            animation: none;
          }

          .progress-line em {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}

async function scanUrl(url: string, scanType: ScanType): Promise<{result: BarrierScanResult; demoMode: boolean}> {
  try {
    const response = await fetch(`${apiBase}/v1/scan`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        url,
        profile: "all",
        crawl: scanType === "quick" ? "quick" : "full",
      }),
    });

    if (!response.ok) throw new Error("Scan failed");
    return {result: normalizeScanResponse(await response.json()), demoMode: false};
  } catch {
    return {result: createMockResult(), demoMode: true};
  }
}

function safeHost(value: string): string {
  const normalized = normalizeScanUrl(value);
  if (!normalized.ok) return "example.com";
  return new URL(normalized.url).host || "example.com";
}

function normalizeScanResponse(response: any): BarrierScanResult {
  const issues = (response.issues || []).map((issue: any, index: number) => ({
    id: issue.id || `issue_${index + 1}`,
    barrier: barrierFromIssueType(issue.type),
    severity: issue.severity || "medium",
    type: issue.type || "manual_review",
    element: issue.element || "body",
    description: issue.description || "Review this accessibility issue.",
    plain_english: issue.plain_english || "This issue may make the page harder to use.",
    wcag_ref: issue.wcag_ref || "review",
    fix_type: fixTypeFromIssueType(issue.type),
    fix_before: issue.snippet?.css || issue.snippet?.html || issue.snippet?.text || "/* original code unavailable */",
    fix_after: suggestedFixFor(issue),
    users_affected: usersAffectedFor(issue.type),
    affected_count: 1,
    fixOptions: {
      A: "Safest change",
      B: "Moderate adjustment",
      C: "Maximum correction",
    },
  }));

  const issuesByBarrier = {
    barrier1: issues.filter((issue: any) => issue.barrier === 1),
    barrier2: issues.filter((issue: any) => issue.barrier === 2),
    barrier3: issues.filter((issue: any) => issue.barrier === 3),
    barrier4: issues.filter((issue: any) => issue.barrier === 4),
    barrier5: issues.filter((issue: any) => issue.barrier === 5),
    barrier6: issues.filter((issue: any) => issue.barrier === 6),
  };

  return {
    score: response.score ?? 41,
    totalIssues: response.summary?.total ?? issues.length,
    estimatedFixTime: estimateFixTime(response.summary?.fixable ?? issues.length),
    topFixes: issues.slice(0, 5),
    issuesByBarrier,
    summary: response.summary || summarizeIssues(issues),
  };
}

function createMockResult(): BarrierScanResult {
  const topFixes = [
    {
      id: "fix_001",
      barrier: 1,
      severity: "critical",
      type: "animation_no_reduced_motion",
      element: ".hero-banner",
      description: "CSS animation running without prefers-reduced-motion wrapper",
      plain_english: "Hero animation plays for all users including those with motion sensitivity",
      wcag_ref: "2.3.3",
      fix_type: "css_global",
      fix_before: ".hero-banner {\n  animation: slide 3s infinite;\n}",
      fix_after:
        "@media (prefers-reduced-motion: no-preference) {\n  .hero-banner {\n    animation: slide 3s infinite;\n  }\n}",
      users_affected: "Users with autism, ADHD, vestibular disorders, migraine sensitivity",
      affected_count: 412,
      fixOptions: {
        A: "Wrap in prefers-reduced-motion (safest — invisible to others)",
        B: "Reduce to single play, no loop",
        C: "Remove animation entirely",
      },
    },
    {
      id: "fix_002",
      barrier: 3,
      severity: "high",
      type: "vague_cta",
      element: "button.cta-primary",
      description: "Button text 'Learn more' gives no information about destination",
      plain_english: "Vague button label — autistic users need explicit labels",
      wcag_ref: "2.4.6",
      fix_type: "html_attribute",
      fix_before: '<button class="cta-primary">\n  Learn more\n</button>',
      fix_after: '<button class="cta-primary">\n  View pricing plans\n</button>',
      users_affected: "Autistic users who process language literally, screen reader users",
      affected_count: 7,
      fixOptions: {
        A: "Replace with explicit label",
        B: "Add aria-label with detail",
        C: "Add tooltip with destination info",
      },
    },
    {
      id: "fix_003",
      barrier: 2,
      severity: "high",
      type: "high_saturation_background",
      element: "section.hero",
      description: "Background color saturation 89% exceeds threshold of 70%",
      plain_english: "Background color is too intense — causes sensory overload",
      wcag_ref: "1.4.3",
      fix_type: "css_element",
      fix_before: ".hero {\n  background: hsl(220, 89%, 56%);\n}",
      fix_after: ".hero {\n  background: hsl(220, 35%, 56%);\n}",
      users_affected: "Users with sensory sensitivity, autism, visual stress",
      affected_count: 1,
      fixOptions: {
        A: "Reduce saturation to 35%",
        B: "Add prefers-contrast media query",
        C: "Replace with neutral tone",
      },
    },
    {
      id: "fix_004",
      barrier: 4,
      severity: "high",
      type: "timer_popup",
      element: "div#newsletter-modal",
      description: "Modal triggered by setTimeout after 3000ms without user action",
      plain_english: "Pop-up appears automatically — unpredictable for autistic users",
      wcag_ref: "3.2.1",
      fix_type: "js_pattern",
      fix_before: "setTimeout(() => {\n  modal.style.display = 'block';\n}, 3000);",
      fix_after:
        "document\n  .querySelector('#open-modal')\n  .addEventListener('click', () => {\n    modal.style.display = 'block';\n  });",
      users_affected: "Autistic users who rely on predictability, ADHD users",
      affected_count: 1,
      fixOptions: {
        A: "Trigger only on explicit user action",
        B: "Delay to 30s with dismissible banner",
        C: "Remove modal entirely",
      },
    },
  ] as BarrierScanResult["topFixes"];

  const extraIssues = [
    ...topFixes,
    {...topFixes[0], id: "fix_005", severity: "medium", plain_english: "Transition runs without reduced-motion support", affected_count: 24},
    {...topFixes[2], id: "fix_006", severity: "medium", plain_english: "Pure white background may cause visual strain", affected_count: 9},
    {...topFixes[1], id: "fix_007", severity: "medium", plain_english: "Paragraphs contain long sentences", affected_count: 38},
    {...topFixes[1], id: "fix_008", severity: "medium", plain_english: "Marketing copy uses jargon", affected_count: 17},
    {...topFixes[3], id: "fix_009", severity: "medium", plain_english: "Hover-only menu has no keyboard equivalent", affected_count: 5},
    {...topFixes[3], id: "fix_010", barrier: 5, severity: "medium", plain_english: "Decorative images are announced to assistive tools", affected_count: 12},
    {...topFixes[3], id: "fix_011", barrier: 6, severity: "low", plain_english: "Session timer needs a clearer extension control", affected_count: 1},
  ] as BarrierScanResult["topFixes"];

  return {
    score: 41,
    totalIssues: 23,
    estimatedFixTime: "~1 hour 20 minutes",
    topFixes,
    issuesByBarrier: {
      barrier1: extraIssues.filter((issue) => issue.barrier === 1),
      barrier2: extraIssues.filter((issue) => issue.barrier === 2),
      barrier3: extraIssues.filter((issue) => issue.barrier === 3),
      barrier4: extraIssues.filter((issue) => issue.barrier === 4),
      barrier5: extraIssues.filter((issue) => issue.barrier === 5),
      barrier6: extraIssues.filter((issue) => issue.barrier === 6),
    },
    summary: {
      critical: 3,
      high: 8,
      medium: 9,
      low: 3,
      fixable: 18,
      total: 23,
    },
  };
}

function barrierFromIssueType(type: string): 1 | 2 | 3 | 4 | 5 | 6 {
  if (/animation|motion/i.test(type)) return 1;
  if (/contrast|color|font/i.test(type)) return 2;
  if (/language|jargon|passive|cognitive/i.test(type)) return 3;
  if (/skip|heading|aria|label|lang/i.test(type)) return 4;
  if (/alt|sensory/i.test(type)) return 5;
  return 6;
}

function fixTypeFromIssueType(type: string): string {
  if (/animation|contrast|font|color/i.test(type)) return "css_element";
  if (/language|jargon|passive/i.test(type)) return "ai_rewrite";
  if (/aria|alt|label|lang/i.test(type)) return "html_attribute";
  return "js_pattern";
}

function suggestedFixFor(issue: any): string {
  if (issue.type === "animation_present") return "@media (prefers-reduced-motion: no-preference) {\n  .element { animation: current; }\n}";
  if (issue.type === "contrast_ratio") return "color: #595959;";
  if (issue.type === "missing_alt_text") return '<img alt="Describe the image clearly" />';
  if (issue.type === "missing_aria_label") return 'aria-label="Describe this action"';
  return "/* Suggested fix will appear here */";
}

function usersAffectedFor(type: string): string {
  if (/animation|sensory|color/i.test(type)) return "Users with autism, ADHD, sensory sensitivity, vestibular disorders";
  if (/language|jargon|passive/i.test(type)) return "Autistic users, dyslexic users, screen reader users";
  return "Keyboard users, screen reader users, autistic users who rely on predictable structure";
}

function summarizeIssues(issues: any[]) {
  return {
    critical: issues.filter((issue) => issue.severity === "critical").length,
    high: issues.filter((issue) => issue.severity === "high").length,
    medium: issues.filter((issue) => issue.severity === "medium").length,
    low: issues.filter((issue) => issue.severity === "low").length,
    fixable: issues.length,
    total: issues.length,
  };
}

function estimateFixTime(count: number): string {
  if (count <= 4) return "~20 minutes";
  if (count <= 10) return "~45 minutes";
  return "~1 hour 20 minutes";
}
