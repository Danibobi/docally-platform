"use client";

import React, {useEffect, useMemo, useState} from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  BarChart3,
  Brain,
  Check,
  Clipboard,
  Code2,
  Copy,
  FileDown,
  KeyRound,
  Loader2,
  PanelTop,
  RotateCcw,
  ScanLine,
  Wrench,
} from "lucide-react";
import type {
  CrawlMode,
  FixResponse,
  FixSuggestion,
  IssueSeverity,
  IssueType,
  PreferenceKey,
  PreferenceRecord,
  PreferenceStateResponse,
  ScanIssue,
  ScanPage,
  ScanProfile,
  ScanResponse,
  TopIssue,
  WeakSignalEvent,
} from "@docally/shared";

const DiffViewer = dynamic(() => import("react-diff-viewer-continued"), {ssr: false});

type Screen = "key" | "scan" | "results" | "page" | "fix" | "stats" | "preferences";
type PageTab = "preview" | "issues" | "code" | "compare";
type PreferenceEditValues = Partial<Record<PreferenceKey, string>>;

const apiBase = process.env.NEXT_PUBLIC_DOCALLY_API_URL || "http://localhost:8787";
const profiles: ScanProfile[] = ["all", "autism", "dyslexia", "sensory", "wcag"];
const severities: IssueSeverity[] = ["critical", "high", "medium", "low"];

const sampleStats = {
  sites: 12,
  pages: 847,
  avgScore: 54,
  fixed: 312,
  common: [
    ["Language complexity", 34],
    ["Missing alt text", 28],
    ["Low contrast", 19],
    ["No reduced-motion", 13],
    ["Other", 6],
  ] as const,
  sitesCompared: [
    ["example.com", 61],
    ["mystore.com", 44],
    ["testsite.io", 72],
  ] as const,
};

const preferenceKeysForInspector: PreferenceKey[] = [
  "communication_depth",
  "language_literalness",
  "motion_level",
  "visual_structure",
  "alert_frequency",
  "audio_support",
];

export function DashboardClient({apiKey}: {apiKey: string}) {
  const [screen, setScreen] = useState<Screen>("key");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedFix, setCopiedFix] = useState(false);
  const [url, setUrl] = useState("https://example.com");
  const [crawl, setCrawl] = useState<CrawlMode>("full");
  const [profile, setProfile] = useState<ScanProfile>("all");
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [selectedPage, setSelectedPage] = useState<ScanPage | null>(null);
  const [pageTab, setPageTab] = useState<PageTab>("issues");
  const [selectedIssue, setSelectedIssue] = useState<ScanIssue | null>(null);
  const [fixes, setFixes] = useState<FixSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [error, setError] = useState("");
  const [preferenceState, setPreferenceState] = useState<PreferenceStateResponse | null>(null);
  const [preferenceEdits, setPreferenceEdits] = useState<PreferenceEditValues>({});
  const [sessionDepth, setSessionDepth] = useState(0);
  const [stepStartedAt, setStepStartedAt] = useState(Date.now());
  const [showExplanation, setShowExplanation] = useState(true);
  const [selectedFixOption, setSelectedFixOption] = useState<"A" | "B" | "C">("A");

  const usage = useMemo(() => ({scans: {used: 47, limit: 100}, fixes: {used: 23, limit: 100}}), []);

  const grouped = useMemo(() => {
    const groups: Record<IssueSeverity, ScanIssue[]> = {critical: [], high: [], medium: [], low: []};
    scan?.issues.forEach((issue) => groups[issue.severity].push(issue));
    return groups;
  }, [scan]);

  const activeFix = fixes.find((fix) => fix.id === selectedIssue?.id) || fixes[0] || null;
  const host = scan?.scanned_url ? new URL(scan.scanned_url).host : "example.com";
  const duration = formatDuration(scan?.duration_ms || 154000);
  const presentation = useMemo(() => buildPresentation(scan?.top_issues || [], preferenceState), [scan?.top_issues, preferenceState]);

  useEffect(() => {
    loadPreferenceState().catch(() => undefined);
  }, []);

  function navigate(next: Screen) {
    if (screen === "fix" && next !== "fix" && next !== "page" && !copiedFix) {
      recordWeakSignal("flow_abandoned").catch(() => undefined);
    }
    setScreen(next);
    setSessionDepth((current) => current + 1);
    setStepStartedAt(Date.now());
  }

  async function copyKey() {
    await navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    window.setTimeout(() => setCopiedKey(false), 1300);
  }

  async function copyFix() {
    if (!activeFix) return;
    await navigator.clipboard.writeText(activeFix.fixed);
    setCopiedFix(true);
    window.setTimeout(() => setCopiedFix(false), 1300);
  }

  async function loadPreferenceState() {
    const response = await fetch(`${apiBase}/v1/preferences/state`, {
      headers: {authorization: `Bearer ${apiKey}`},
    });
    if (!response.ok) return;
    setPreferenceState(await response.json());
  }

  async function recordWeakSignal(event: WeakSignalEvent, issueType: IssueType | undefined = selectedIssue?.type) {
    const response = await fetch(`${apiBase}/v1/preferences/weak-signals`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        event,
        context: {
          surface: "dashboard",
          issueType,
          sessionDepth,
          timeOnStep: Math.round((Date.now() - stepStartedAt) / 1000),
        },
      }),
    });
    if (response.ok) {
      const data = await response.json();
      setPreferenceState(data.state);
    }
  }

  async function savePreference(preferenceKey: PreferenceKey, value: string) {
    const response = await fetch(`${apiBase}/v1/preferences/state`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        preferences: [
          {
            preference_key: preferenceKey,
            value,
            context: {surface: "dashboard", workflow: "preference_inspector"},
          },
        ],
      }),
    });
    if (response.ok) {
      setPreferenceState(await response.json());
      setPreferenceEdits((current) => ({...current, [preferenceKey]: ""}));
    }
  }

  async function undoPreference(preferenceKey: PreferenceKey) {
    await recordWeakSignal("adaptation_undone");
    const response = await fetch(`${apiBase}/v1/preferences/state`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({undo_preference_keys: [preferenceKey]}),
    });
    if (response.ok) setPreferenceState(await response.json());
  }

  async function runScan() {
    setLoading(true);
    setError("");
    setFixes([]);
    setSelectedIssue(null);
    try {
      const response = await fetch(`${apiBase}/v1/scan`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({url, profile, crawl}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Scan failed");
      setScan(data);
      setSelectedPage(data.pages?.[0] || null);
      navigate("results");
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  async function fixIssues(issueIds: string[]) {
    if (!scan) return;
    setFixing(true);
    setError("");
    try {
      const response = await fetch(`${apiBase}/v1/fix`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({scan_id: scan.scan_id, issue_ids: issueIds, profile}),
      });
      const data = (await response.json()) as FixResponse & {message?: string};
      if (!response.ok) throw new Error(data?.message || "Fix generation failed");
      setFixes(data.fixes);
      setSelectedIssue(scan.issues.find((issue) => issue.id === issueIds[0]) || scan.issues[0] || null);
      setSelectedFixOption("A");
      setShowExplanation(true);
      navigate("fix");
    } catch (fixError) {
      setError(fixError instanceof Error ? fixError.message : "Fix generation failed");
    } finally {
      setFixing(false);
    }
  }

  function exportReport() {
    if (!scan) return;
    const blob = new Blob([JSON.stringify(scan, null, 2)], {type: "application/json"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${scan.scan_id}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">DA</span>
          <div>
            <strong>DocAlly</strong>
            <span>Developer platform</span>
          </div>
        </div>
        <nav className="side-nav" aria-label="Dashboard sections">
          <NavButton active={screen === "key"} icon={<KeyRound size={16} />} onClick={() => setScreen("key")}>API key</NavButton>
          <NavButton active={screen === "scan"} icon={<ScanLine size={16} />} onClick={() => navigate("scan")}>New scan</NavButton>
          <NavButton active={screen === "results"} icon={<PanelTop size={16} />} onClick={() => scan && navigate("results")}>Results</NavButton>
          <NavButton active={screen === "preferences"} icon={<Brain size={16} />} onClick={() => navigate("preferences")}>Preferences</NavButton>
          <NavButton active={screen === "stats"} icon={<BarChart3 size={16} />} onClick={() => navigate("stats")}>Statistics</NavButton>
        </nav>
      </aside>

      <section className="dashboard-main">
        <header className="topbar">
          <div>
            <h1>{titleFor(screen)}</h1>
            <p>{subtitleFor(screen)}</p>
          </div>
          <button className="button primary" type="button" onClick={() => navigate("scan")}>
            <ScanLine size={16} /> New scan
          </button>
        </header>

        {error ? <div className="error-box">{error}</div> : null}

        {screen === "key" ? <ApiKeyScreen apiKey={apiKey} copied={copiedKey} copyKey={copyKey} usage={usage} /> : null}
        {screen === "scan" ? (
          <ScanInputScreen
            url={url}
            setUrl={setUrl}
            crawl={crawl}
            setCrawl={setCrawl}
            profile={profile}
            setProfile={setProfile}
            loading={loading}
            runScan={runScan}
          />
        ) : null}
        {screen === "results" ? (
          <ResultsScreen
            scan={scan}
            host={host}
            duration={duration}
            setScreen={navigate}
            setSelectedPage={setSelectedPage}
            presentation={presentation}
            undoAdaptation={() => undoPreference(presentation.preferenceKey || "visual_structure")}
            fixCritical={() => fixIssues(grouped.critical.map((issue) => issue.id))}
            exportReport={exportReport}
            fixing={fixing}
          />
        ) : null}
        {screen === "page" ? (
          <PageDetailScreen
            page={selectedPage}
            issues={scan?.issues || []}
            tab={pageTab}
            setTab={setPageTab}
            setScreen={navigate}
            fixIssue={(issue) => {
              setSelectedIssue(issue);
              fixIssues([issue.id]);
            }}
            fixing={fixing}
          />
        ) : null}
        {screen === "fix" ? (
          <FixScreen
            issue={selectedIssue}
            fix={activeFix}
            copied={copiedFix}
            copyFix={copyFix}
            setScreen={navigate}
            showExplanation={showExplanation}
            selectedFixOption={selectedFixOption}
            setSelectedFixOption={(option) => {
              setSelectedFixOption(option);
              if (option !== "A") recordWeakSignal("simpler_option_chosen").catch(() => undefined);
            }}
            toggleExplanation={() => {
              const next = !showExplanation;
              setShowExplanation(next);
              recordWeakSignal(next ? "fix_explanation_expanded" : "fix_explanation_collapsed").catch(() => undefined);
            }}
            skipFix={() => {
              recordWeakSignal("fix_skipped").catch(() => undefined);
              navigate("page");
            }}
            recordRewrite={() => recordWeakSignal("fix_rewritten").catch(() => undefined)}
          />
        ) : null}
        {screen === "preferences" ? (
          <PreferenceInspector
            state={preferenceState}
            edits={preferenceEdits}
            setEdit={(key, value) => setPreferenceEdits((current) => ({...current, [key]: value}))}
            savePreference={savePreference}
            undoPreference={undoPreference}
            reload={loadPreferenceState}
          />
        ) : null}
        {screen === "stats" ? <StatsScreen /> : null}
      </section>
    </main>
  );
}

function ApiKeyScreen({apiKey, copied, copyKey, usage}: {apiKey: string; copied: boolean; copyKey: () => void; usage: {scans: {used: number; limit: number}; fixes: {used: number; limit: number}}}) {
  return (
    <section className="panel narrow">
      <div className="panel-header">
        <div>
          <h2>Your API key</h2>
          <p>Use this key in the playground or directly from your app.</p>
        </div>
      </div>
      <div className="panel-body stack">
        <div className="api-key-row">
          <code className="code-pill">{apiKey}</code>
          <button className="button primary" type="button" onClick={copyKey}>
            {copied ? <Check size={16} /> : <Clipboard size={16} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <UsageRow label="Scans" used={usage.scans.used} limit={usage.scans.limit} />
        <UsageRow label="Fixes" used={usage.fixes.used} limit={usage.fixes.limit} />
        <button className="text-link" type="button">View API docs</button>
      </div>
    </section>
  );
}

function ScanInputScreen(props: {
  url: string;
  setUrl: (url: string) => void;
  crawl: CrawlMode;
  setCrawl: (crawl: CrawlMode) => void;
  profile: ScanProfile;
  setProfile: (profile: ScanProfile) => void;
  loading: boolean;
  runScan: () => void;
}) {
  return (
    <section className="panel scan-input-panel">
      <div className="panel-header">
        <h2>New Scan</h2>
      </div>
      <div className="panel-body stack large">
        <label className="field-label" htmlFor="scan-url">URL to scan</label>
        <div className="scan-row">
          <input id="scan-url" className="input" value={props.url} onChange={(event) => props.setUrl(event.target.value)} />
          <button className="button primary" type="button" onClick={props.runScan} disabled={props.loading}>
            {props.loading ? <Loader2 size={16} /> : <ScanLine size={16} />}
            {props.loading ? "Scanning" : "Scan"}
          </button>
        </div>

        <div className="radio-stack" role="radiogroup" aria-label="Crawl depth">
          <RadioOption selected={props.crawl === "quick"} onClick={() => props.setCrawl("quick")} title="Quick scan" text="single page" />
          <RadioOption selected={props.crawl === "full"} onClick={() => props.setCrawl("full")} title="Full crawl" text="entire site, up to 50 pages" />
          <RadioOption selected={props.crawl === "deep"} onClick={() => props.setCrawl("deep")} title="Deep crawl" text="unlimited — Pro only" />
        </div>

        <div>
          <div className="field-label">Profile</div>
          <div className="profiles">
            {profiles.map((item) => (
              <button
                key={item}
                className={`profile-pill ${props.profile === item ? "is-selected" : ""}`}
                type="button"
                onClick={() => props.setProfile(item)}
              >
                {profileLabel(item)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultsScreen({scan, host, duration, setScreen, setSelectedPage, presentation, undoAdaptation, fixCritical, exportReport, fixing}: {
  scan: ScanResponse | null;
  host: string;
  duration: string;
  setScreen: (screen: Screen) => void;
  setSelectedPage: (page: ScanPage) => void;
  presentation: {issues: TopIssue[]; explanation: string; preferenceKey?: PreferenceKey};
  undoAdaptation: () => void;
  fixCritical: () => void;
  exportReport: () => void;
  fixing: boolean;
}) {
  if (!scan) return <EmptyState title="No scan yet" text="Run a scan to see site results." action={() => setScreen("scan")} actionLabel="New scan" />;
  const manual = Math.max(0, scan.summary.total - scan.summary.fixable);
  return (
    <section className="panel">
      <div className="panel-header result-title">
        <div>
          <h2>{host}</h2>
          <p>{crawlLabel(scan.crawl)} · {scan.pages_scanned} pages · {duration}</p>
        </div>
        <div className="score-badge">Score: <span>{scan.score}</span></div>
      </div>
      <div className="panel-body stack large">
        <SectionTitle>SITE OVERVIEW</SectionTitle>
        <div className="overview-grid">
          <Metric label="Pages scanned" value={scan.pages_scanned} />
          <Metric label="Issues found" value={scan.summary.total} />
          <Metric label="Critical" value={scan.summary.critical} tone="critical" />
          <Metric label="High" value={scan.summary.high} tone="high" />
          <Metric label="Medium" value={scan.summary.medium} />
          <Metric label="Low" value={scan.summary.low} />
          <Metric label="Fixable" value={scan.summary.fixable} />
          <Metric label="Manual review" value={manual} />
        </div>

        <div className="split-section">
          <div>
            <SectionTitle>WORST PAGES</SectionTitle>
            <div className="table-list">
              {scan.pages.map((page) => (
                <button
                  key={page.url}
                  className="table-row"
                  type="button"
                  onClick={() => {
                    setSelectedPage(page);
                    setScreen("page");
                  }}
                >
                  <span>{page.path}</span>
                  <span>Score <strong>{page.score}</strong></span>
                  <span>{page.issue_count} issues</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>TOP ISSUES ACROSS SITE</SectionTitle>
            {presentation.explanation ? (
              <div className="preference-note">
                <span>{presentation.explanation}</span>
                <button className="text-link compact" type="button" onClick={undoAdaptation}><RotateCcw size={14} /> Undo adaptation</button>
              </div>
            ) : null}
            <div className="table-list">
              {presentation.issues.map((issue) => (
                <div className="table-row static" key={issue.type}>
                  <span>{issue.label}</span>
                  <span>{issue.pages_affected} pages affected</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="action-row">
          <button className="button primary" type="button" onClick={fixCritical} disabled={!scan.summary.critical || fixing}>Fix all critical</button>
          <button className="button" type="button" onClick={exportReport}><FileDown size={16} /> Export report</button>
          <button className="button" type="button" onClick={() => scan.pages[0] && (setSelectedPage(scan.pages[0]), setScreen("page"))}>View page-by-page</button>
          <button className="button" type="button">Get embed badge</button>
        </div>
      </div>
    </section>
  );
}

function PageDetailScreen({page, issues, tab, setTab, setScreen, fixIssue, fixing}: {
  page: ScanPage | null;
  issues: ScanIssue[];
  tab: PageTab;
  setTab: (tab: PageTab) => void;
  setScreen: (screen: Screen) => void;
  fixIssue: (issue: ScanIssue) => void;
  fixing: boolean;
}) {
  if (!page) return <EmptyState title="No page selected" text="Choose a page from results." action={() => setScreen("results")} actionLabel="Back to results" />;
  const pageIssues = issues.slice(0, Math.max(2, Math.min(issues.length, page.issue_count)));
  return (
    <section className="panel">
      <div className="panel-header result-title">
        <div>
          <button className="back-button" type="button" onClick={() => setScreen("results")}><ArrowLeft size={16} /> Back</button>
          <h2>{page.path}</h2>
        </div>
        <div className="score-badge">Score: <span>{page.score}</span> <em>{page.critical ? "Critical" : "Review"}</em></div>
      </div>
      <div className="panel-body stack">
        <div className="tabs">
          {(["preview", "issues", "code", "compare"] as PageTab[]).map((item) => (
            <button key={item} className={`tab ${tab === item ? "is-selected" : ""}`} type="button" onClick={() => setTab(item)}>{tabLabel(item)}</button>
          ))}
        </div>

        {tab === "issues" ? (
          <div className="issue-cards">
            {severities.map((severity) => {
              const filtered = pageIssues.filter((issue) => issue.severity === severity);
              if (!filtered.length) return null;
              return (
                <div key={severity}>
                  <SectionTitle>{severity.toUpperCase()}</SectionTitle>
                  {filtered.map((issue) => (
                    <article className="issue-card" key={issue.id}>
                      <div>
                        <h3>{labelIssue(issue.type)}</h3>
                        <p>{issue.element}</p>
                        <blockquote>{issue.snippet?.text || issue.plain_english}</blockquote>
                        <small>{issue.description} · WCAG {issue.wcag_ref}</small>
                      </div>
                      <button className="button" type="button" disabled={fixing} onClick={() => fixIssue(issue)}>
                        <Wrench size={16} /> Fix code
                      </button>
                    </article>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <PlaceholderTab tab={tab} page={page} />
        )}
      </div>
    </section>
  );
}

function FixScreen({
  issue,
  fix,
  copied,
  copyFix,
  setScreen,
  showExplanation,
  selectedFixOption,
  setSelectedFixOption,
  toggleExplanation,
  skipFix,
  recordRewrite,
}: {
  issue: ScanIssue | null;
  fix: FixSuggestion | null;
  copied: boolean;
  copyFix: () => void;
  setScreen: (screen: Screen) => void;
  showExplanation: boolean;
  selectedFixOption: "A" | "B" | "C";
  setSelectedFixOption: (option: "A" | "B" | "C") => void;
  toggleExplanation: () => void;
  skipFix: () => void;
  recordRewrite: () => void;
}) {
  if (!fix) return <EmptyState title="No fix selected" text="Choose an issue from page detail." action={() => setScreen("page")} actionLabel="Back to page" />;
  return (
    <section className="panel">
      <div className="panel-header result-title">
        <div>
          <h2>Fix: {issue ? labelIssue(issue.type) : fix.id}</h2>
          <p>{issue?.element || "selected element"} · WCAG {issue?.wcag_ref || "review"} · {issue?.severity || "selected"}</p>
        </div>
      </div>
      <div className="panel-body stack large">
        <div className="fix-options" role="radiogroup" aria-label="Fix presentation option">
          {(["A", "B", "C"] as const).map((option) => (
            <button
              key={option}
              className={`profile-pill ${selectedFixOption === option ? "is-selected" : ""}`}
              type="button"
              role="radio"
              aria-checked={selectedFixOption === option}
              onClick={() => setSelectedFixOption(option)}
            >
              Option {option}
            </button>
          ))}
        </div>
        <div className="diff-label">BEFORE / AFTER</div>
        <div className="diff-shell">
          <DiffViewer oldValue={fix.original} newValue={fix.fixed} splitView={false} useDarkTheme hideLineNumbers={false} />
        </div>
        <div className="change-box">
          <button className="text-link compact" type="button" onClick={toggleExplanation}>
            {showExplanation ? "Hide explanation" : "Show explanation"}
          </button>
          {showExplanation ? (
            <>
              <strong>Changes:</strong>
              <p>{fix.explanation}</p>
            </>
          ) : null}
        </div>
        <div className="action-row">
          <button className="button primary" type="button" onClick={copyFix}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy fix"}</button>
          <button className="button" type="button">Apply to all similar</button>
          <button className="button" type="button" onClick={recordRewrite}>Mark edited</button>
          <button className="button" type="button" onClick={skipFix}>Skip</button>
        </div>
      </div>
    </section>
  );
}

function PreferenceInspector({
  state,
  edits,
  setEdit,
  savePreference,
  undoPreference,
  reload,
}: {
  state: PreferenceStateResponse | null;
  edits: PreferenceEditValues;
  setEdit: (key: PreferenceKey, value: string) => void;
  savePreference: (key: PreferenceKey, value: string) => void;
  undoPreference: (key: PreferenceKey) => void;
  reload: () => void;
}) {
  const records = state?.preferences || [];
  return (
    <section className="panel">
      <div className="panel-header result-title">
        <div>
          <h2>Preference Inspector</h2>
          <p>Inspect, edit, or undo the beta preference layer. Scan results stay unchanged.</p>
        </div>
        <button className="button" type="button" onClick={reload}>Refresh</button>
      </div>
      <div className="panel-body stack large">
        <div className="preference-policy">
          <Metric label="Adaptation" value={state?.adaptation_allowed ? "On" : "Bounded"} />
          <Metric label="Minimum confidence" value={state?.safety_policy.minimum_confidence ?? "0.7"} />
          <Metric label="Active records" value={records.length} />
        </div>
        <div className="preference-list">
          {preferenceKeysForInspector.map((key) => {
            const record = records.find((item) => item.preference_key === key);
            const editValue = edits[key] ?? "";
            return (
              <article className="preference-card" key={key}>
                <div>
                  <h3>{preferenceLabel(key)}</h3>
                  <p>{record ? record.value : "No preference set"}</p>
                  <small>
                    {record
                      ? `${record.source_signal} · confidence ${record.confidence.toFixed(2)} · updated ${formatDate(record.updated_at)}`
                      : "DocAlly will not adapt this area until there is an explicit choice or bounded signal."}
                  </small>
                </div>
                <div className="preference-controls">
                  <input
                    className="input"
                    value={editValue}
                    placeholder="Set explicit value"
                    onChange={(event) => setEdit(key, event.target.value)}
                  />
                  <button className="button primary" type="button" disabled={!editValue.trim()} onClick={() => savePreference(key, editValue.trim())}>
                    Save
                  </button>
                  <button className="button" type="button" disabled={!record} onClick={() => undoPreference(key)}>
                    <RotateCcw size={16} /> Undo
                  </button>
                </div>
                {record?.contradiction_history.length ? (
                  <div className="contradiction-list">
                    <strong>Contradictions</strong>
                    {record.contradiction_history.slice(-3).map((item) => (
                      <span key={`${item.observed_at}-${item.next_value}`}>
                        {item.previous_value} → {item.next_value} · {formatDate(item.observed_at)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
        {state?.explanations.length ? (
          <div className="change-box">
            <strong>Why DocAlly may adapt</strong>
            {state.explanations.map((explanation) => <p key={explanation}>{explanation}</p>)}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StatsScreen() {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Statistics</h2>
      </div>
      <div className="panel-body stack large">
        <SectionTitle>YOUR SITES</SectionTitle>
        <div className="overview-grid stats-grid">
          <Metric label="Sites scanned" value={sampleStats.sites} />
          <Metric label="Total pages" value={sampleStats.pages} />
          <Metric label="Avg score" value={`${sampleStats.avgScore}/100`} />
          <Metric label="Issues fixed" value={sampleStats.fixed} />
        </div>
        <SectionTitle>SCORE OVER TIME</SectionTitle>
        <div className="line-chart" aria-label="Score over time">
          {Array.from({length: 28}, (_, index) => <span key={index} style={{height: `${26 + ((index * 7) % 42)}px`}} />)}
        </div>
        <div className="chart-axis"><span>Apr</span><span>May</span><span>Jun</span></div>
        <SectionTitle>MOST COMMON ISSUES</SectionTitle>
        <div className="bar-list">
          {sampleStats.common.map(([label, value]) => <BarRow key={label} label={label} value={value} />)}
        </div>
        <SectionTitle>COMPARE SITES</SectionTitle>
        <div className="compare-list">
          {sampleStats.sitesCompared.map(([site, score]) => <CompareRow key={site} site={site} score={score} />)}
        </div>
      </div>
    </section>
  );
}

function UsageRow({label, used, limit}: {label: string; used: number; limit: number}) {
  const percent = Math.round((used / limit) * 100);
  return (
    <div className="usage-row">
      <header><span>{label}</span><span className="mono-number">{used} / {limit}</span></header>
      <div className="bar"><span style={{width: `${percent}%`}} /></div>
    </div>
  );
}

function RadioOption({selected, title, text, onClick}: {selected: boolean; title: string; text: string; onClick: () => void}) {
  return (
    <button className="radio-option" type="button" role="radio" aria-checked={selected} onClick={onClick}>
      <span>{selected ? "●" : "○"}</span>
      <strong>{title}</strong>
      <em>{text}</em>
    </button>
  );
}

function Metric({label, value, tone}: {label: string; value: string | number; tone?: "critical" | "high"}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={tone || ""}>{value}</strong>
    </div>
  );
}

function SectionTitle({children}: {children: React.ReactNode}) {
  return <h3 className="section-title">{children}</h3>;
}

function EmptyState({title, text, action, actionLabel}: {title: string; text: string; action: () => void; actionLabel: string}) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="button primary" type="button" onClick={action}>{actionLabel}</button>
    </div>
  );
}

function PlaceholderTab({tab, page}: {tab: PageTab; page: ScanPage}) {
  return (
    <div className="placeholder-tab">
      <Code2 size={18} />
      <h3>{tabLabel(tab)}</h3>
      <p>{page.path} · Score {page.score} · {page.issue_count} issues</p>
    </div>
  );
}

function BarRow({label, value}: {label: string; value: number}) {
  return (
    <div className="bar-row">
      <span>{label}</span>
      <div className="mini-bar"><span style={{width: `${value}%`}} /></div>
      <strong className="mono-number">{value}%</strong>
    </div>
  );
}

function CompareRow({site, score}: {site: string; score: number}) {
  return (
    <div className="compare-row">
      <span>{site}</span>
      <strong className="mono-number">{score}</strong>
      <div className="score-track"><span style={{width: `${score}%`}} /></div>
    </div>
  );
}

function NavButton({active, icon, children, onClick}: {active: boolean; icon: React.ReactNode; children: React.ReactNode; onClick: () => void}) {
  return <button className={active ? "is-active" : ""} type="button" onClick={onClick}>{icon}{children}</button>;
}

function titleFor(screen: Screen): string {
  if (screen === "scan") return "New Scan";
  if (screen === "results") return "Scan Results";
  if (screen === "page") return "Page Detail";
  if (screen === "fix") return "Code Fix";
  if (screen === "preferences") return "Preferences";
  if (screen === "stats") return "Statistics";
  return "DocAlly Developer Dashboard";
}

function subtitleFor(screen: Screen): string {
  if (screen === "scan") return "Choose a URL, crawl depth, and profile.";
  if (screen === "results") return "Site-level overview, worst pages, and top issues.";
  if (screen === "page") return "Inspect one page and generate code fixes.";
  if (screen === "fix") return "Review the before and after diff.";
  if (screen === "preferences") return "Inspect and control adaptive preferences.";
  if (screen === "stats") return "Track scan quality and issue trends.";
  return "API key, usage, and product entry point.";
}

function profileLabel(profile: ScanProfile): string {
  if (profile === "wcag") return "WCAG 2.2";
  return profile[0].toUpperCase() + profile.slice(1);
}

function crawlLabel(crawl: string): string {
  if (crawl === "quick") return "Quick scan";
  if (crawl === "deep") return "Deep crawl";
  return "Full crawl";
}

function tabLabel(tab: PageTab): string {
  if (tab === "preview") return "Preview";
  if (tab === "issues") return "Issues";
  if (tab === "code") return "Code fixes";
  return "Compare";
}

function labelIssue(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes ? `${minutes}m ${remainder}s` : `${seconds}s`;
}

function buildPresentation(issues: TopIssue[], state: PreferenceStateResponse | null): {issues: TopIssue[]; explanation: string; preferenceKey?: PreferenceKey} {
  const minimumConfidence = state?.safety_policy.minimum_confidence ?? 1;
  const active = state?.preferences.find((preference) => preference.enabled && preference.confidence >= minimumConfidence);
  if (!active) return {issues, explanation: ""};

  const priorityTypes = priorityIssueTypes(active);
  if (!priorityTypes.length) {
    return {
      issues,
      preferenceKey: active.preference_key,
      explanation: `Presentation note: ${preferenceLabel(active.preference_key)} is visible, but scan findings are unchanged.`,
    };
  }

  return {
    issues: [...issues].sort((a, b) => priorityScore(b.type, priorityTypes) - priorityScore(a.type, priorityTypes)),
    preferenceKey: active.preference_key,
    explanation: `Shown first because ${preferenceLabel(active.preference_key).toLowerCase()} is active. Scan findings are unchanged.`,
  };
}

function priorityIssueTypes(preference: PreferenceRecord): IssueType[] {
  if (preference.preference_key === "language_literalness" || preference.preference_key === "communication_depth") {
    return ["language_complexity", "jargon", "passive_voice", "cognitive_load"];
  }
  if (preference.preference_key === "motion_level") {
    return ["animation_present", "sensory_overload"];
  }
  if (preference.preference_key === "visual_structure") {
    return ["heading_hierarchy", "missing_skip_link", "form_input_label", "missing_aria_label"];
  }
  if (preference.preference_key === "alert_frequency") {
    return ["cognitive_load", "sensory_overload"];
  }
  return [];
}

function priorityScore(type: IssueType, priorityTypes: IssueType[]): number {
  const index = priorityTypes.indexOf(type);
  return index === -1 ? 0 : priorityTypes.length - index;
}

function preferenceLabel(key: PreferenceKey): string {
  const labels: Record<PreferenceKey, string> = {
    communication_depth: "Communication depth",
    language_literalness: "Language literalness",
    motion_level: "Motion level",
    visual_structure: "Visual structure",
    alert_frequency: "Alert frequency",
    audio_support: "Audio support",
  };
  return labels[key];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"}).format(new Date(value));
}
