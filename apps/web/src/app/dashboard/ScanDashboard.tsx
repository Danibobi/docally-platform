"use client";

import {useMemo, useState} from "react";
import type {ReactNode} from "react";
import {Geist, Instrument_Serif, JetBrains_Mono} from "next/font/google";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle,
  ChevronLeft,
  Clock,
  Code2,
  Eye,
  FileText,
  Gavel,
  Layers,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";

const instrument = Instrument_Serif({subsets: ["latin"], weight: "400"});
const geist = Geist({subsets: ["latin"], weight: ["400", "500"]});
const mono = JetBrains_Mono({subsets: ["latin"], weight: ["400", "500"]});

export type BarrierNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type Severity = "critical" | "high" | "medium" | "low";
export type FixOptions = {A: string; B: string; C: string};

export interface BarrierIssue {
  id: string;
  barrier: BarrierNumber;
  severity: Severity;
  type: string;
  element: string;
  description: string;
  plain_english: string;
  wcag_ref: string;
  fix_type: string;
  fix_before: string;
  fix_after: string;
  users_affected: string;
  affected_count: number;
  fixOptions: FixOptions;
  status?: "fixed";
  resolved_at?: string;
}

export interface BarrierScanResult {
  score: number;
  totalIssues: number;
  estimatedFixTime: string;
  topFixes: BarrierIssue[];
  issuesByBarrier: Record<`barrier${BarrierNumber}`, BarrierIssue[]>;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    fixable: number;
    total: number;
  };
  demoMode?: boolean;
}

interface ScanDashboardProps {
  url: string;
  result: BarrierScanResult;
  onNewScan: () => void;
}

type TabKey = "overview" | "issues" | "solutions" | "resources" | "laws" | "technical";
type IssueTabKey = "all" | "critical" | "high" | "medium" | "low" | "fixed";
type DemoStep = 0 | 1 | 2 | 3;
type FixOptionKey = keyof FixOptions;

interface IssueCategory {
  id: string;
  name: string;
  severity: Severity;
  count: number;
  description: string;
  experience: string;
  why: string;
  recommendation: string;
  focusModeHelps: boolean;
  issues: BarrierIssue[];
}

const tabs: Array<{key: TabKey; label: string}> = [
  {key: "overview", label: "Overview"},
  {key: "issues", label: "Issues"},
  {key: "solutions", label: "Solutions"},
  {key: "resources", label: "Resources"},
  {key: "laws", label: "Laws"},
  {key: "technical", label: "Technical Details"},
];

const quizSteps = [
  {
    question: "What type of website is this?",
    options: ["SaaS / Product", "E-commerce", "Marketing site", "Education / Content", "Enterprise / Internal tool"],
  },
  {
    question: "What is the biggest usability challenge?",
    options: [
      "Too much visual clutter",
      "Reading is hard",
      "Too many animations/distractions",
      "Navigation feels overwhelming",
      "Accessibility support is needed",
    ],
  },
  {
    question: "How large is your company?",
    options: ["1-10", "11-50", "51-200", "201-1000", "1000+"],
  },
] as const;

export function ScanDashboard({url, result, onNewScan}: ScanDashboardProps) {
  const allIssues = useMemo(() => Object.values(result.issuesByBarrier).flat(), [result.issuesByBarrier]);
  const categories = useMemo(() => buildIssueCategories(result), [result]);
  const focusHelpCount = categories.filter((category) => category.focusModeHelps).reduce((total, category) => total + category.count, 0);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "");
  const [categoryDetailsOpen, setCategoryDetailsOpen] = useState(false);
  const [selectedFix, setSelectedFix] = useState<BarrierIssue | null>(result.topFixes[0] || allIssues[0] || null);
  const [selectedOption, setSelectedOption] = useState<FixOptionKey>("A");
  const [flowOpen, setFlowOpen] = useState(false);
  const [demoStep, setDemoStep] = useState<DemoStep>(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [previewFocus, setPreviewFocus] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [toast, setToast] = useState("");
  const host = safeHost(url);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) || categories[0];
  const risk = riskLevelFor(result);
  const issueIndex = selectedFix ? allIssues.findIndex((issue) => issue.id === selectedFix.id) : -1;

  function openCategory(category: IssueCategory) {
    setSelectedCategoryId(category.id);
    setActiveTab("issues");
    setCategoryDetailsOpen(false);
  }

  function selectFix(issue: BarrierIssue) {
    setSelectedFix(issue);
    setSelectedOption("A");
    setActiveTab("technical");
  }

  function answerQuiz(answer: string) {
    setAnswers((current) => [...current.slice(0, demoStep), answer]);
    setDemoStep((current) => Math.min(3, current + 1) as DemoStep);
  }

  function closeFlow() {
    setFlowOpen(false);
    setDemoStep(0);
    setAnswers([]);
  }

  async function copyFix() {
    if (!selectedFix) return;
    await navigator.clipboard.writeText(fixAfterFor(selectedFix, selectedOption));
    showToast("Copied fix");
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2000);
  }

  function moveIssue(direction: -1 | 1) {
    if (!allIssues.length) return;
    const nextIndex = issueIndex < 0 ? 0 : (issueIndex + direction + allIssues.length) % allIssues.length;
    selectFix(allIssues[nextIndex]);
  }

  return (
    <main className={`${geist.className} scanner-dashboard`}>
      <section className="dashboard-main">
        <header className="topbar">
          <div>
            <div className={`${instrument.className} wordmark`}>DocAlly</div>
            <p>{host} {result.demoMode ? "· Demo mode" : ""}</p>
          </div>
          <button type="button" onClick={onNewScan}>New Scan</button>
        </header>

        <nav className="tabs" aria-label="Scan result sections">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? "is-active" : ""}
              type="button"
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <section className="scan-summary" aria-label="Scan summary">
          <div className="summary-copy">
            <p className="eyebrow">SCAN COMPLETE</p>
            <h1 className={instrument.className}>A calmer website is possible without a rebuild.</h1>
            <p>
              DocAlly found patterns that may create cognitive overload, reading friction, visual clutter, or motion overload.
              Focus Mode gives users a clearer way to browse while your existing website stays intact.
            </p>
            <div className="status-row">
              <span><i /> Scan complete</span>
              <span>{risk} risk</span>
              <span>{focusHelpCount} Focus Mode-helpable findings</span>
            </div>
          </div>
          <CircularScore score={result.score} />
        </section>
        <p className="score-note">This score reflects issue severity, user impact, and page coverage — not just total findings.</p>

        <section className="tab-panel">
          {activeTab === "overview" ? (
            <OverviewTab
              categories={categories}
              focusHelpCount={focusHelpCount}
              openCategory={openCategory}
              openFlow={() => setFlowOpen(true)}
              previewFocus={previewFocus}
              setPreviewFocus={setPreviewFocus}
              previewZoom={previewZoom}
              setPreviewZoom={setPreviewZoom}
            />
          ) : null}
          {activeTab === "issues" ? (
            <IssuesTab
              issues={allIssues}
              selectedIssueId={selectedFix?.id || ""}
              selectFix={selectFix}
            />
          ) : null}
          {activeTab === "solutions" ? <SolutionsTab openFlow={() => setFlowOpen(true)} /> : null}
          {activeTab === "resources" ? <ResourcesTab /> : null}
          {activeTab === "laws" ? <LawsTab /> : null}
          {activeTab === "technical" ? (
            <TechnicalDetails
              issues={allIssues}
              selectedFix={selectedFix}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              selectFix={selectFix}
              copyFix={copyFix}
              moveIssue={moveIssue}
              showToast={showToast}
            />
          ) : null}
        </section>
      </section>

      <aside className="solution-panel">
        <p className="eyebrow">Recommended next step</p>
        <h2 className={instrument.className}>Preview Focus Mode</h2>
        <p>
          Focus Mode can reduce visual clutter, remove distracting animations, improve reading clarity, and offer a calmer
          experience for users who may experience cognitive overload.
        </p>
        <ul className="solution-list">
          {[
            "Reduce accessibility risk",
            "Offer a clearer user experience",
            "Keep your existing website",
            "Re-analyze and stay aligned as your site changes",
          ].map((item) => (
            <li key={item}><Check size={15} /> {item}</li>
          ))}
        </ul>
        <button className="primary-button" type="button" onClick={() => setFlowOpen(true)}>Apply Focus Mode</button>
        <p className="panel-note">
          Focus Mode supports clearer browsing without promising guaranteed compliance or fine prevention.
        </p>
      </aside>

      {flowOpen ? (
        <GuidedFlow
          step={demoStep}
          answers={answers}
          answerQuiz={answerQuiz}
          close={closeFlow}
          openBooking={() => setBookingOpen(true)}
          previewFocus={previewFocus}
          setPreviewFocus={setPreviewFocus}
          previewZoom={previewZoom}
          setPreviewZoom={setPreviewZoom}
        />
      ) : null}
      {bookingOpen ? <BookingModal close={() => setBookingOpen(false)} /> : null}
      {toast ? <div className="toast"><i /> {toast}</div> : null}

      <style jsx>{`
        .scanner-dashboard {
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          background: #0A0A0A;
          color: #F5F5F0;
        }

        .dashboard-main {
          min-width: 0;
          padding: 28px 32px 40px;
        }

        .topbar,
        .scan-summary,
        .section-row,
        .detail-header,
        .code-label-row,
        .fix-nav,
        .modal-header,
        .flow-header,
        .zoom-controls,
        .preview-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .wordmark {
          font-size: 20px;
          line-height: 1;
        }

        p,
        .topbar p,
        .score-note,
        .detail-card p,
        .solution-panel p,
        .resource-card p,
        .flow-card p,
        .modal-body p {
          margin: 0;
          color: #888580;
          font-size: 13px;
          line-height: 1.55;
        }

        button {
          font: inherit;
        }

        .topbar button,
        .secondary-button,
        .ghost-button,
        .zoom-controls button,
        .flow-close {
          border: 1px solid #1E1E1E;
          border-radius: 6px;
          background: transparent;
          color: #888580;
          padding: 8px 12px;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background-color 0.15s, transform 0.12s;
        }

        .topbar button:hover,
        .secondary-button:hover,
        .ghost-button:hover,
        .zoom-controls button:hover,
        .flow-close:hover {
          border-color: #2A2A2A;
          color: #F5F5F0;
        }

        .topbar button:active,
        .secondary-button:active,
        .ghost-button:active,
        .primary-button:active,
        .zoom-controls button:active,
        .flow-close:active {
          transform: scale(0.97);
        }

        .scan-summary {
          align-items: stretch;
          margin-top: 28px;
          border: 1px solid #1E1E1E;
          border-radius: 8px;
          background: #111111;
          padding: 28px;
        }

        .summary-copy {
          max-width: 760px;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #4A4A46;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h1,
        h2,
        h3 {
          margin: 0;
          font-weight: 400;
        }

        h1 {
          max-width: 760px;
          font-size: 48px;
          line-height: 1.04;
        }

        h2 {
          font-size: 23px;
        }

        h3 {
          font-size: 17px;
        }

        .summary-copy > p:not(.eyebrow) {
          max-width: 700px;
          margin-top: 14px;
          font-size: 15px;
        }

        .status-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 18px;
        }

        .status-row span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid #1E1E1E;
          border-radius: 999px;
          background: #0A0A0A;
          color: #888580;
          padding: 5px 10px;
          font-size: 12px;
        }

        .status-row i {
          width: 7px;
          height: 7px;
          border-radius: 7px;
          background: #1E8449;
        }

        .score-note {
          margin-top: 12px;
        }

        .tabs {
          display: flex;
          gap: 4px;
          margin-top: 28px;
          border-bottom: 1px solid #1E1E1E;
          overflow-x: auto;
        }

        .tabs button {
          border: 0;
          border-bottom: 2px solid transparent;
          background: transparent;
          color: #888580;
          padding: 12px 10px;
          font-size: 13px;
          white-space: nowrap;
          cursor: pointer;
        }

        .tabs button:hover,
        .tabs button.is-active {
          color: #F5F5F0;
        }

        .tabs button.is-active {
          border-bottom-color: #E8DCC8;
        }

        .tab-panel {
          margin-top: 24px;
        }

        .issues-table-section {
          min-width: 0;
        }

        .issues-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .issues-title-row,
        .severity-summary-chips {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .issues-label {
          margin: 0;
          color: #4A4A46;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .issues-count-badge {
          border: 1px solid #1E1E1E;
          border-radius: 4px;
          background: #161616;
          color: #888580;
          padding: 2px 10px;
          font-size: 12px;
        }

        .severity-summary-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          border-radius: 4px;
          padding: 3px 10px;
          font-size: 12px;
        }

        .severity-summary-chip i {
          width: 6px;
          height: 6px;
          border-radius: 6px;
        }

        .severity-summary-chip.critical {
          border: 1px solid rgba(192,57,43,0.3);
          background: rgba(192,57,43,0.15);
          color: #E74C3C;
        }

        .severity-summary-chip.high {
          border: 1px solid rgba(214,137,16,0.3);
          background: rgba(214,137,16,0.15);
          color: #F39C12;
        }

        .severity-summary-chip.medium {
          border: 1px solid rgba(74,144,217,0.3);
          background: rgba(74,144,217,0.15);
          color: #5DADE2;
        }

        .issue-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 0;
          overflow-x: auto;
          border-bottom: 1px solid #1E1E1E;
        }

        .issue-tabs button {
          margin-bottom: -1px;
          border: 0;
          border-bottom: 2px solid transparent;
          background: transparent;
          color: #4A4A46;
          padding: 8px 16px;
          font-size: 13px;
          white-space: nowrap;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }

        .issue-tabs button:hover {
          color: #888580;
        }

        .issue-tabs button.is-active {
          border-bottom-color: #E8DCC8;
          color: #F5F5F0;
        }

        .issue-tabs button span {
          margin-left: 6px;
          color: #4A4A46;
          font-size: 10px;
        }

        .issue-tabs button.is-active span {
          color: #888580;
        }

        .issues-table {
          min-width: 970px;
          overflow: hidden;
        }

        .issues-table-header,
        .issue-table-row {
          display: grid;
          grid-template-columns: 8px 100px minmax(0, 1fr) 90px 70px 80px 60px 100px 80px;
          align-items: center;
        }

        .issues-table-header {
          height: 36px;
          border-bottom: 1px solid #1E1E1E;
          padding: 0 16px;
          background: transparent;
        }

        .issues-table-header span {
          color: #4A4A46;
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .issue-group-header {
          height: 32px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #1E1E1E;
          background: #0D0D0D;
          padding: 0 16px;
        }

        .issue-group-header span {
          color: #888580;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .issue-group-header em {
          color: #4A4A46;
          font-size: 11px;
          font-style: normal;
        }

        .barrier-dot {
          width: 6px;
          height: 6px;
          border-radius: 6px;
        }

        .barrier-dot.barrier-1,
        .barrier-dot.barrier-4 {
          background: #D68910;
        }

        .barrier-dot.barrier-2 {
          background: #C0392B;
        }

        .barrier-dot.barrier-3 {
          background: #4A90D9;
        }

        .barrier-dot.barrier-5 {
          background: #1E8449;
        }

        .barrier-dot.barrier-6 {
          background: #888580;
        }

        .issue-table-row {
          width: 100%;
          height: 44px;
          min-height: 44px;
          max-height: 44px;
          overflow: hidden;
          border: 0;
          border-bottom: 1px solid #1E1E1E;
          border-left: 2px solid;
          background: transparent;
          color: #F5F5F0;
          padding: 0 16px;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.1s;
        }

        .issue-border-space {
          width: 8px;
          height: 100%;
        }

        .issue-table-row:hover {
          background: #111111;
        }

        .issue-table-row.is-selected {
          background: #131313;
        }

        .issue-table-row.is-fixed {
          cursor: default;
          opacity: 0.7;
        }

        .issue-severity-pill,
        .severity-pill {
          justify-self: start;
          border-radius: 4px;
          padding: 2px 8px;
          font-family: ${geist.style.fontFamily};
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          line-height: 1.35;
          text-transform: uppercase;
        }

        .issue-severity-pill.critical,
        .severity-pill.critical {
          border: 1px solid rgba(192,57,43,0.3);
          background: rgba(192,57,43,0.15);
          color: #E74C3C;
        }

        .issue-severity-pill.high,
        .severity-pill.high {
          border: 1px solid rgba(214,137,16,0.3);
          background: rgba(214,137,16,0.15);
          color: #F39C12;
        }

        .issue-severity-pill.medium,
        .severity-pill.medium {
          border: 1px solid rgba(74,144,217,0.3);
          background: rgba(74,144,217,0.15);
          color: #5DADE2;
        }

        .issue-severity-pill.low,
        .severity-pill.low {
          border: 1px solid rgba(74,74,70,0.3);
          background: rgba(74,74,70,0.15);
          color: #888580;
        }

        .issue-severity-pill.is-fixed {
          border-color: #1E1E1E;
          background: #161616;
          color: #4A4A46;
        }

        .issue-description-cell {
          min-width: 0;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding-right: 16px;
        }

        .issue-description-cell strong {
          color: #F5F5F0;
          font-size: 13px;
          font-weight: 400;
        }

        .issue-table-row.is-fixed .issue-description-cell strong {
          color: #4A4A46;
          text-decoration: line-through;
        }

        .issue-barrier-cell {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #888580;
          font-size: 12px;
        }

        .issue-impact-tag {
          justify-self: start;
          border: 1px solid #1E1E1E;
          border-radius: 3px;
          padding: 2px 6px;
          font-family: ${geist.style.fontFamily};
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.08em;
          line-height: 1.25;
          text-transform: uppercase;
        }

        .issue-impact-tag.massive {
          border-color: rgba(192,57,43,0.4);
          background: rgba(192,57,43,0.2);
          color: #E74C3C;
        }

        .issue-impact-tag.large {
          border-color: rgba(214,137,16,0.3);
          background: rgba(214,137,16,0.15);
          color: #F39C12;
        }

        .issue-impact-tag.medium {
          border-color: rgba(74,144,217,0.25);
          background: rgba(74,144,217,0.1);
          color: #5DADE2;
        }

        .issue-impact-tag.small {
          border-color: rgba(74,74,70,0.3);
          background: rgba(74,74,70,0.15);
          color: #888580;
        }

        .issue-impact-tag.minimal {
          border-color: #1E1E1E;
          background: transparent;
          color: #4A4A46;
        }

        .issue-elements-cell {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #888580;
          font-size: 12px;
        }

        .issue-elements-cell.is-notable {
          color: #D68910;
        }

        .issue-elements-cell.is-serious {
          color: #C0392B;
        }

        .issue-wcag-cell {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #4A4A46;
          font-size: 11px;
        }

        .issue-fine-cell {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px;
        }

        .issue-action {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          justify-self: start;
          border: 1px solid #1E1E1E;
          border-radius: 4px;
          background: transparent;
          color: #888580;
          padding: 4px 10px;
          font-size: 12px;
          transition: border-color 0.15s, color 0.15s;
        }

        .issue-table-row:hover .issue-action:not(.is-fixed) {
          border-color: #E8DCC8;
          color: #E8DCC8;
        }

        .issue-action.is-fixed {
          border-color: rgba(30,132,73,0.3);
          color: #1E8449;
        }

        .issue-empty-state {
          height: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-bottom: 1px solid #1E1E1E;
        }

        .issue-empty-state svg {
          color: #1E8449;
        }

        .issue-empty-state p {
          color: #4A4A46;
          font-size: 13px;
        }

        .issues-layout,
        .technical-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 18px;
        }

        .overview-dashboard {
          display: grid;
          gap: 22px;
        }

        .overview-section {
          min-width: 0;
        }

        .issue-widget-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          margin-top: 16px;
        }

        .issue-widget-card,
        .overview-preview-panel,
        .detail-card,
        .resource-card,
        .solution-card,
        .technical-shell,
        .fix-detail,
        .solution-panel,
        .modal-card,
        .flow-card {
          border: 1px solid #1E1E1E;
          border-radius: 8px;
          background: #111111;
        }

        .issue-widget-card {
          min-height: 218px;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: space-between;
          gap: 14px;
          padding: 18px;
          transition: border-color 0.15s, background-color 0.15s;
        }

        .issue-widget-card:hover,
        .issue-widget-card.is-highlighted {
          border-color: #2A2A2A;
          background: #161616;
        }

        .issue-widget-top,
        .issue-widget-meta {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .issue-widget-card h3 {
          font-family: ${instrument.style.fontFamily};
          font-size: 22px;
          line-height: 1.08;
        }

        .issue-widget-card p {
          min-height: 62px;
          color: #888580;
          font-size: 13px;
          line-height: 1.55;
        }

        .issue-widget-meta span {
          color: #888580;
          font-size: 12px;
        }

        .issue-widget-meta strong {
          color: #E8DCC8;
          font-size: 12px;
          font-weight: 400;
        }

        .impact-badge {
          border: 1px solid #1E1E1E;
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 11px;
          white-space: nowrap;
        }

        .impact-badge.high {
          border-color: rgba(214,137,16,0.3);
          background: rgba(214,137,16,0.15);
          color: #F39C12;
        }

        .impact-badge.medium {
          border-color: rgba(74,144,217,0.25);
          background: rgba(74,144,217,0.1);
          color: #5DADE2;
        }

        .impact-badge.low {
          border-color: rgba(74,74,70,0.3);
          background: rgba(74,74,70,0.15);
          color: #888580;
        }

        .issue-widget-card button {
          width: 100%;
          border: 1px solid #1E1E1E;
          border-radius: 6px;
          background: transparent;
          color: #888580;
          padding: 8px 10px;
          font-size: 13px;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background-color 0.15s, transform 0.12s;
        }

        .issue-widget-card button:hover {
          border-color: #E8DCC8;
          color: #E8DCC8;
        }

        .issue-widget-card button:active {
          transform: scale(0.98);
        }

        .severity-dot {
          width: 8px;
          height: 8px;
          border-radius: 8px;
        }

        .severity-dot.critical { background: #C0392B; }
        .severity-dot.high { background: #D68910; }
        .severity-dot.medium { background: #4A90D9; }
        .severity-dot.low { background: #888580; }

        .solutions-copy {
          border: 1px solid #1E1E1E;
          border-radius: 8px;
          background: #111111;
          padding: 18px;
        }

        .overview-preview-panel {
          padding: 18px;
        }

        .preview-panel-heading {
          margin-bottom: 14px;
        }

        .affected-preview-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 8px;
          margin-bottom: 14px;
        }

        .affected-preview-list span {
          border: 1px solid #1E1E1E;
          border-radius: 6px;
          background: #0A0A0A;
          color: #888580;
          padding: 10px 12px;
          font-size: 13px;
          transition: border-color 0.15s, color 0.15s, background-color 0.15s;
        }

        .affected-preview-list span.is-highlighted {
          border-color: #E8DCC8;
          background: rgba(232,220,200,0.05);
          color: #F5F5F0;
        }

        .overview-preview-panel p:not(.eyebrow) {
          max-width: 720px;
          color: #888580;
          font-size: 13px;
          line-height: 1.55;
        }

        .preview-top {
          margin-bottom: 12px;
        }

        .focus-toggle {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #F5F5F0;
          font-size: 13px;
        }

        .focus-toggle button {
          width: 50px;
          height: 26px;
          border: 1px solid #1E1E1E;
          border-radius: 8px;
          background: #161616;
          padding: 3px;
          cursor: pointer;
        }

        .focus-toggle button span {
          display: block;
          width: 18px;
          height: 18px;
          border-radius: 6px;
          background: #888580;
        }

        .focus-toggle button.is-on {
          background: #E8DCC8;
        }

        .focus-toggle button.is-on span {
          margin-left: auto;
          background: #0A0A0A;
        }

        .preview-shell {
          border: 1px solid #1E1E1E;
          border-radius: 8px;
          background: #111111;
          padding: 16px;
        }

        .preview-stage {
          min-height: 280px;
          border: 1px solid #1E1E1E;
          border-radius: 8px;
          overflow: auto;
          background: #0A0A0A;
        }

        .preview-scale {
          min-height: 280px;
          transform-origin: top left;
          transition: transform 0.18s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .busy-preview,
        .calm-preview {
          min-height: 280px;
          padding: 18px;
        }

        .busy-preview {
          color: #F5F5F0;
          background: #101010;
        }

        .busy-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .busy-block,
        .busy-video,
        .busy-copy,
        .busy-cta {
          border: 1px solid #2A2A2A;
          border-radius: 6px;
          background: #161616;
          padding: 12px;
        }

        .busy-video {
          min-height: 92px;
          display: grid;
          place-items: center;
          color: #888580;
        }

        .busy-copy {
          grid-column: 1 / -1;
          color: #888580;
          line-height: 1.35;
        }

        .busy-cta {
          color: #E8DCC8;
        }

        .calm-preview {
          background: #F5F5F0;
          color: #0A0A0A;
        }

        .calm-preview h3 {
          max-width: 560px;
          font-size: 34px;
          line-height: 1.1;
        }

        .calm-preview p {
          max-width: 620px;
          margin-top: 14px;
          color: #242424;
          font-size: 17px;
          line-height: 1.7;
        }

        .calm-preview button {
          margin-top: 18px;
          border: 0;
          border-radius: 6px;
          background: #0A0A0A;
          color: #F5F5F0;
          padding: 10px 16px;
        }

        .focus-confirmation {
          margin-top: 12px;
          color: #1E8449;
          font-size: 13px;
        }

        .zoom-controls {
          justify-content: flex-start;
          margin-top: 12px;
        }

        .zoom-controls button {
          display: inline-grid;
          place-items: center;
          width: 30px;
          height: 30px;
          padding: 0;
        }

        .zoom-controls span {
          color: #888580;
          font-size: 12px;
        }

        .detail-card,
        .solution-card,
        .technical-shell {
          padding: 18px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .detail-card h3,
        .solution-card h3,
        .resource-card h3 {
          margin-bottom: 6px;
          font-family: ${instrument.style.fontFamily};
          font-size: 22px;
        }

        .technical-list {
          display: grid;
          gap: 10px;
          margin-top: 14px;
        }

        .technical-item,
        .issue-row {
          border: 1px solid #1E1E1E;
          border-radius: 8px;
          background: #0D0D0D;
          color: #F5F5F0;
          padding: 14px;
          text-align: left;
        }

        .technical-item code {
          display: inline-block;
          margin: 8px 0;
          color: #E8DCC8;
          font-family: ${mono.style.fontFamily};
          font-size: 12px;
        }

        .solution-grid,
        .resource-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .solution-card,
        .resource-card {
          padding: 16px;
        }

        .solution-card svg,
        .resource-card svg {
          color: #E8DCC8;
          margin-bottom: 10px;
        }

        .solution-panel {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          border-top: 0;
          border-right: 0;
          border-bottom: 0;
          border-radius: 0;
          padding: 28px 24px;
        }

        .solution-panel h2 {
          font-size: 30px;
          line-height: 1.08;
        }

        .solution-list,
        .recommend-list {
          display: grid;
          gap: 10px;
          margin: 20px 0;
          padding: 0;
          list-style: none;
        }

        .solution-list li,
        .recommend-list li {
          display: flex;
          gap: 9px;
          color: #F5F5F0;
          font-size: 13px;
        }

        .solution-list svg,
        .recommend-list svg {
          flex: 0 0 auto;
          color: #1E8449;
        }

        .primary-button {
          width: 100%;
          border: 0;
          border-radius: 6px;
          background: #E8DCC8;
          color: #0A0A0A;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s, transform 0.12s;
        }

        .primary-button:hover {
          background: #C4B89A;
        }

        .panel-note {
          border-top: 1px solid #1E1E1E;
          margin-top: 20px;
          padding-top: 16px;
        }

        .issue-list {
          display: grid;
          gap: 10px;
        }

        .issue-row {
          cursor: pointer;
          transition: border-color 0.15s, background-color 0.15s;
        }

        .issue-row:hover {
          border-color: #2A2A2A;
          background: #111111;
        }

        .issue-row p {
          margin-top: 8px;
        }

        .fix-detail {
          padding: 16px;
          display: grid;
          gap: 12px;
        }

        .detail-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .detail-chips span {
          border: 1px solid #1E1E1E;
          border-radius: 4px;
          background: #161616;
          color: #888580;
          padding: 4px 8px;
          font-size: 11px;
        }

        .option-toggle {
          display: flex;
          gap: 2px;
        }

        .option-toggle button {
          border: 0;
          border-radius: 4px;
          background: transparent;
          color: #4A4A46;
          padding: 3px 8px;
          font: 400 11px/1 ${mono.style.fontFamily};
          cursor: pointer;
        }

        .option-toggle button.is-selected {
          background: #1E1E1E;
          color: #F5F5F0;
        }

        .code-block {
          display: grid;
          gap: 6px;
        }

        .code-block label {
          color: #4A4A46;
          font-size: 11px;
        }

        .code-block pre {
          margin: 0;
          overflow-x: auto;
          border-radius: 0 4px 4px 0;
          padding: 12px;
          font: 400 12px/1.5 ${mono.style.fontFamily};
          white-space: pre;
        }

        .code-block.before pre {
          border-left: 2px solid #C0392B;
          background: rgba(192, 57, 43, 0.06);
          color: #E57373;
        }

        .code-block.after pre {
          border-left: 2px solid #1E8449;
          background: rgba(30, 132, 73, 0.06);
          color: #6FCF97;
        }

        .copy-button {
          border: 0;
          border-radius: 6px;
          background: #E8DCC8;
          color: #0A0A0A;
          padding: 9px 0;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }

        .copy-button:hover {
          background: #C4B89A;
        }

        .secondary-actions,
        .next-issue div {
          display: flex;
          gap: 8px;
        }

        .flow-backdrop,
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          background: rgba(10, 10, 10, 0.84);
          padding: 20px;
        }

        .flow-card {
          width: min(980px, 100%);
          max-height: min(860px, 92vh);
          overflow-y: auto;
          padding: 22px;
        }

        .flow-progress {
          height: 4px;
          margin: 18px 0 26px;
          border-radius: 4px;
          background: #1E1E1E;
          overflow: hidden;
        }

        .flow-progress span {
          display: block;
          height: 100%;
          border-radius: 4px;
          background: #E8DCC8;
          transition: width 0.2s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .flow-options {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 20px;
        }

        .flow-options button {
          border: 1px solid #1E1E1E;
          border-radius: 8px;
          background: #0A0A0A;
          color: #F5F5F0;
          padding: 14px;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.15s, background-color 0.15s, transform 0.12s;
        }

        .flow-options button:hover {
          border-color: #2A2A2A;
          background: #111111;
        }

        .flow-options button:active {
          transform: scale(0.98);
        }

        .flow-final {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
          gap: 20px;
          align-items: start;
        }

        .modal-card {
          width: min(460px, 100%);
          padding: 20px;
        }

        .modal-header button {
          border: 1px solid #1E1E1E;
          border-radius: 6px;
          background: transparent;
          color: #888580;
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          cursor: pointer;
        }

        .calendar-placeholder {
          margin-top: 16px;
          border: 1px solid #1E1E1E;
          border-radius: 6px;
          background: #161616;
          color: #4A4A46;
          padding: 14px;
          font-size: 13px;
        }

        .toast {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 1001;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #1E1E1E;
          border-radius: 6px;
          background: #111111;
          color: #F5F5F0;
          padding: 10px 16px;
          font-size: 13px;
        }

        .toast i {
          width: 6px;
          height: 6px;
          border-radius: 6px;
          background: #1E8449;
        }

        @media (max-width: 1120px) {
          .scanner-dashboard,
          .issues-layout,
          .technical-grid,
          .flow-final {
            grid-template-columns: 1fr;
          }

          .solution-panel {
            position: static;
            height: auto;
            border-left: 0;
            border-top: 1px solid #1E1E1E;
          }
        }

        @media (max-width: 760px) {
          .dashboard-main {
            padding: 18px;
          }

          .scan-summary,
          .detail-grid,
          .solution-grid,
          .resource-grid,
          .flow-options {
            grid-template-columns: 1fr;
          }

          .scan-summary {
            display: grid;
          }

          h1 {
            font-size: 36px;
          }
        }

        /* ── BENTO GRID ─────────────────────────────── */

        .bento-section {
          background: #B8BFB2;
          border-radius: 20px;
          padding: 32px;
        }

        .bento-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .bento-title {
          font-size: 26px;
          font-weight: 600;
          color: #1A1A18;
          margin: 0 0 4px;
          line-height: 1.2;
        }

        .bento-subtitle {
          font-size: 14px;
          color: #4A4A44;
          margin: 0;
          line-height: 1.4;
        }

        .bento-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .bento-filters {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .bento-filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1.5px solid rgba(0,0,0,0.13);
          border-radius: 999px;
          background: #F5F5EE;
          color: #2A2A24;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.12s, border-color 0.12s;
          white-space: nowrap;
        }

        .bento-filter-chip:hover:not(.is-active) {
          background: #EDEEE8;
        }

        .bento-filter-chip.is-active {
          background: #DFFF3F;
          border-color: #CBEE2A;
          color: #1A1A14;
        }

        .bento-sort-chip {
          border: 1.5px solid rgba(0,0,0,0.13);
          border-radius: 999px;
          background: #F5F5EE;
          color: #2A2A24;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          user-select: none;
        }

        .issue-bento-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .issue-bento-card {
          background: #F7F8F5;
          border-radius: 28px;
          padding: 28px;
          min-height: 260px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
        }

        .issue-bento-card.large {
          grid-column: span 2;
        }

        .issue-bento-card.wide {
          grid-column: span 2;
          min-height: 200px;
        }

        .issue-bento-card:hover:not(.is-fixed) {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.1);
        }

        .issue-bento-card.is-selected {
          box-shadow: 0 0 0 2.5px #DFFF3F, 0 4px 20px rgba(0,0,0,0.08);
        }

        .issue-bento-card.is-fixed {
          opacity: 0.6;
          cursor: default;
        }

        .bento-card-icon {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(223,255,63,0.22);
          color: #4A6B1A;
          flex-shrink: 0;
        }

        .bento-card-title {
          font-size: 20px;
          font-weight: 600;
          color: #1A1A18;
          line-height: 1.25;
          margin: 4px 0 0;
          flex: 1;
        }

        .bento-card-desc {
          font-size: 14px;
          color: #6A6A62;
          line-height: 1.5;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .bento-card-badges {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: auto;
        }

        .bento-severity-badge {
          border-radius: 999px;
          padding: 4px 11px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .bento-severity-badge.critical {
          background: rgba(192,57,43,0.12);
          color: #C0392B;
        }

        .bento-severity-badge.high {
          background: rgba(214,137,16,0.13);
          color: #A8700A;
        }

        .bento-severity-badge.medium {
          background: rgba(74,144,217,0.12);
          color: #2E7FC0;
        }

        .bento-severity-badge.low {
          background: rgba(74,74,70,0.1);
          color: #5A5A54;
        }

        .bento-wcag-badge {
          border: 1px solid rgba(0,0,0,0.14);
          border-radius: 999px;
          background: transparent;
          color: #4A4A44;
          padding: 4px 11px;
          font-size: 12px;
          white-space: nowrap;
        }

        .bento-fine-badge {
          border: 1px solid;
          border-radius: 999px;
          padding: 4px 11px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0.8;
        }

        .bento-solution-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #DFFF3F;
          color: #1A1A14;
          border: none;
          border-radius: 999px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          align-self: flex-start;
          margin-top: 4px;
          transition: background 0.12s, transform 0.1s;
          white-space: nowrap;
        }

        .bento-solution-btn:hover:not(:disabled) {
          background: #CBEE2A;
          transform: translateX(2px);
        }

        .bento-solution-btn:disabled {
          background: rgba(0,0,0,0.08);
          color: #8A8A84;
          cursor: default;
        }

        @media (max-width: 1024px) {
          .issue-bento-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .issue-bento-card.large,
          .issue-bento-card.wide {
            grid-column: span 2;
          }
        }

        @media (max-width: 640px) {
          .issue-bento-grid {
            grid-template-columns: 1fr;
          }

          .issue-bento-card.large,
          .issue-bento-card.wide {
            grid-column: span 1;
          }

          .bento-section {
            padding: 20px 16px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}

function CircularScore({score: rawScore}: {score: number}) {
  // Score clamped to 10-90 range.
  // 0 and 100 are never shown —
  // 0 implies completely broken (misleading),
  // 100 implies perfect (no site is perfect).
  const score = rawScore === 0 ? 12 : rawScore > 90 ? 88 : Math.min(90, Math.max(10, rawScore));
  const size = 172;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColorFor(score);

  return (
    <div className="score-ring" role="img" aria-label={`Normalized clarity score: ${score} out of 100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="score-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className="score-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-center">
        <strong className={mono.className} style={{color}}>{score}</strong>
        <span>normalized score</span>
      </div>
      <style jsx>{`
        .score-ring {
          position: relative;
          flex: 0 0 172px;
          width: 172px;
          height: 172px;
          display: grid;
          place-items: center;
        }

        svg {
          position: absolute;
          inset: 0;
        }

        .score-track,
        .score-value {
          fill: none;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
          stroke-linecap: round;
        }

        .score-track {
          stroke: #1E1E1E;
        }

        .score-value {
          transition: stroke-dashoffset 0.35s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .score-center {
          position: relative;
          z-index: 1;
          display: grid;
          justify-items: center;
          gap: 4px;
        }

        strong {
          font-size: 48px;
          line-height: 1;
          font-weight: 400;
        }

        span {
          max-width: 90px;
          color: #888580;
          font-size: 11px;
          line-height: 1.2;
          text-align: center;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}

function OverviewTab(props: {
  categories: IssueCategory[];
  focusHelpCount: number;
  openCategory: (category: IssueCategory) => void;
  openFlow: () => void;
  previewFocus: boolean;
  setPreviewFocus: (enabled: boolean) => void;
  previewZoom: number;
  setPreviewZoom: (zoom: number) => void;
}) {
  const [highlightedCategoryId, setHighlightedCategoryId] = useState(props.categories[0]?.id || "");

  return (
    <div className="overview-dashboard">
      <section className="overview-section">
        <div className="section-row">
          <div>
            <h2>What needs attention first</h2>
          </div>
        </div>
        <div className="issue-widget-grid">
          {props.categories.map((category) => (
            <IssueWidgetCard
              category={category}
              isHighlighted={highlightedCategoryId === category.id}
              key={category.id}
              onAction={() => setHighlightedCategoryId(category.id)}
            />
          ))}
        </div>
      </section>

      <FocusModePreviewPanel highlightedCategoryId={highlightedCategoryId} />
    </div>
  );
}

function IssueWidgetCard({category, isHighlighted, onAction}: {category: IssueCategory; isHighlighted: boolean; onAction: () => void}) {
  return (
    <article className={`issue-widget-card ${isHighlighted ? "is-highlighted" : ""}`}>
      <div className="issue-widget-top">
        <h3>{category.name}</h3>
        <span className={`impact-badge ${impactLabelForCategory(category).toLowerCase().split(" ")[0]}`}>
          {impactLabelForCategory(category)}
        </span>
      </div>
      <p>{category.description}</p>
      <div className="issue-widget-meta">
        <span className={mono.className}>{category.count} {category.count === 1 ? "finding" : "findings"}</span>
        <strong>{solutionLabelForCategory(category)}</strong>
      </div>
      <button type="button" onClick={onAction}>{actionLabelForCategory(category)}</button>
    </article>
  );
}

function FocusModePreviewPanel({highlightedCategoryId}: {highlightedCategoryId: string}) {
  const previewItems = [
    {label: "Promo banner", categoryId: "visual-overload"},
    {label: "Animated carousel", categoryId: "motion-animation"},
    {label: "Video autoplay area", categoryId: "motion-animation"},
    {label: "Newsletter modal", categoryId: "navigation-complexity"},
    {label: "Dense CTA section", categoryId: "reading-clarity"},
  ];

  return (
    <section className="overview-preview-panel">
      <div className="preview-panel-heading">
        <div>
          <p className="eyebrow">Focus Mode preview</p>
          <h2>Before and after</h2>
        </div>
      </div>
      <div className="affected-preview-list">
        {previewItems.map((item) => (
          <span className={highlightedCategoryId === item.categoryId ? "is-highlighted" : ""} key={item.label}>
            {item.label}
          </span>
        ))}
      </div>
      <p>
        Focus Mode reduces visual clutter and creates a calmer browsing layer before committing to a full rebuild.
      </p>
    </section>
  );
}

function bentoBadgeSize(index: number): string {
  if (index % 6 === 0) return "large";
  if (index % 6 === 3) return "wide";
  return "";
}

function IssuesTab({issues, selectedIssueId, selectFix}: {issues: BarrierIssue[]; selectedIssueId: string; selectFix: (issue: BarrierIssue) => void}) {
  const [activeFilter, setActiveFilter] = useState<IssueTabKey>("all");
  const counts = issueCounts(issues);
  const visibleIssues = sortIssuesForTab(issues, activeFilter);

  return (
    <section className="bento-section">
      <header className="bento-header">
        <div className="bento-header-left">
          <h2 className="bento-title">Issues found</h2>
          <p className="bento-subtitle">Accessibility issues detected in your project.</p>
        </div>
        <div className="bento-header-right">
          <div className="bento-filters">
            {([
              ["all", "All issues", counts.total],
              ["critical", "Critical", counts.critical],
              ["high", "High", counts.high],
              ["medium", "Medium", counts.medium],
            ] as Array<[IssueTabKey, string, number]>).map(([key, label, count]) => (
              <button
                key={key}
                className={`bento-filter-chip ${activeFilter === key ? "is-active" : ""}`}
                type="button"
                onClick={() => setActiveFilter(key)}
              >
                {label} <span className={mono.className}>{count}</span>
              </button>
            ))}
          </div>
          <div className="bento-sort-chip">Sort by: Severity ↓</div>
        </div>
      </header>

      {visibleIssues.length ? (
        <div className="issue-bento-grid">
          {visibleIssues.map((issue, index) => (
            <IssueBentoCard
              key={issue.id}
              issue={issue}
              isSelected={issue.id === selectedIssueId}
              sizeClass={bentoBadgeSize(index)}
              selectFix={selectFix}
            />
          ))}
        </div>
      ) : (
        <IssueEmptyState tab={activeFilter} />
      )}
    </section>
  );
}

function barrierIcon(barrier: BarrierNumber): ReactNode {
  const icons: Record<BarrierNumber, ReactNode> = {
    1: <Sparkles size={22} />,
    2: <Eye size={22} />,
    3: <FileText size={22} />,
    4: <Navigation size={22} />,
    5: <Layers size={22} />,
    6: <Clock size={22} />,
  };
  return icons[barrier];
}

function IssueBentoCard({issue, isSelected, sizeClass, selectFix}: {
  issue: BarrierIssue;
  isSelected: boolean;
  sizeClass: string;
  selectFix: (issue: BarrierIssue) => void;
}) {
  const fine = fineExposureMeta(issue.severity);
  const fixed = issueStatus(issue) === "fixed";

  return (
    <article
      className={`issue-bento-card ${sizeClass} ${isSelected ? "is-selected" : ""} ${fixed ? "is-fixed" : ""}`}
      onClick={() => !fixed && selectFix(issue)}
    >
      <div className="bento-card-icon">{barrierIcon(issue.barrier)}</div>
      <h3 className="bento-card-title">{issue.plain_english}</h3>
      <p className="bento-card-desc">{issue.description}</p>
      <div className="bento-card-badges">
        <span className={`bento-severity-badge ${issue.severity}`}>{issue.severity}</span>
        <span className="bento-wcag-badge">WCAG {issue.wcag_ref}</span>
        <span className="bento-fine-badge" style={{color: fine.color, borderColor: fine.color}}>{fine.row}</span>
      </div>
      <button
        className="bento-solution-btn"
        type="button"
        onClick={(e) => { e.stopPropagation(); if (!fixed) selectFix(issue); }}
        disabled={fixed}
      >
        {fixed ? "Fixed ✓" : "See solution →"}
      </button>
    </article>
  );
}

function IssueEmptyState({tab}: {tab: IssueTabKey}) {
  const message =
    tab === "fixed"
      ? "No fixes applied yet. Click Fix → on any issue to start."
      : `No ${tab === "all" ? "" : tab} issues found`.replace("  ", " ");
  return (
    <div className="issue-empty-state">
      <CheckCircle size={20} />
      <p>{message}</p>
    </div>
  );
}

function SolutionsTab({openFlow}: {openFlow: () => void}) {
  return (
    <section>
      <div className="section-row">
        <div>
          <p className="eyebrow">SOLUTIONS</p>
          <h2>Focus Mode in one layer</h2>
        </div>
        <button className="primary-button" type="button" onClick={openFlow}>Solve This Problem</button>
      </div>
      <div className="solution-grid">
        <SolutionCard icon={<Sparkles size={18} />} title="One calmer experience">
          Focus Mode can be enabled as a clearer browsing layer for users who prefer less visual noise.
        </SolutionCard>
        <SolutionCard icon={<Code2 size={18} />} title="No full rebuild">
          Keep the existing website while offering a simplified path through the same content.
        </SolutionCard>
        <SolutionCard icon={<RotateCcw size={18} />} title="Stay aligned">
          DocAlly can re-analyze pages as they change, helping the Focus Mode layer stay updated over time.
        </SolutionCard>
        <SolutionCard icon={<FileText size={18} />} title="Broader platform direction">
          DocAlly also points toward document intelligence, but this scanner flow focuses only on websites.
        </SolutionCard>
      </div>
    </section>
  );
}

function ResourcesTab() {
  return (
    <section>
      <p className="eyebrow">RESOURCES</p>
      <h2>How to understand the findings</h2>
      <div className="resource-grid">
        <SolutionCard icon={<BookOpen size={18} />} title="Cognitive overload">
          Busy pages, competing actions, and unclear hierarchy can make it harder to decide what to do next.
        </SolutionCard>
        <SolutionCard icon={<BookOpen size={18} />} title="Reading clarity">
          Plain, literal language helps more users understand content without extra interpretation.
        </SolutionCard>
        <SolutionCard icon={<BookOpen size={18} />} title="Reduced motion">
          Motion controls support users who prefer calmer experiences or who are sensitive to animation.
        </SolutionCard>
        <SolutionCard icon={<BookOpen size={18} />} title="Progressive remediation">
          Start with high-impact categories, then inspect technical details when your team is ready.
        </SolutionCard>
      </div>
    </section>
  );
}

function LawsTab() {
  return (
    <section>
      <p className="eyebrow">LAWS</p>
      <h2>Accessibility risk, explained safely</h2>
      <div className="solutions-copy">
        <p>
          Accessibility requirements can create legal and remediation risk for companies, especially as digital accessibility
          expectations increase. DocAlly helps teams identify barriers and support clearer browsing, but it does not guarantee
          compliance or fine prevention.
        </p>
        <p>
          Use this report as a prioritization tool: reduce accessibility risk, improve user experience, and give your team a
          clearer path toward remediation.
        </p>
      </div>
    </section>
  );
}

function TechnicalDetails(props: {
  issues: BarrierIssue[];
  selectedFix: BarrierIssue | null;
  selectedOption: FixOptionKey;
  setSelectedOption: (option: FixOptionKey) => void;
  selectFix: (issue: BarrierIssue) => void;
  copyFix: () => void;
  moveIssue: (direction: -1 | 1) => void;
  showToast: (message: string) => void;
}) {
  return (
    <section className="technical-shell">
      <p className="eyebrow">TECHNICAL DETAILS</p>
      <h2>Code-level findings</h2>
      <p>Inspect specific affected areas and copy suggested fixes when your team is ready.</p>
      <div className="technical-grid">
        <div className="issue-list">
          {props.issues.map((issue) => (
            <button className="issue-row" key={issue.id} type="button" onClick={() => props.selectFix(issue)}>
              <SeverityPill severity={issue.severity} />
              <p>{issue.plain_english}</p>
            </button>
          ))}
          {!props.issues.length ? <p>No technical issues were returned for this scan.</p> : null}
        </div>
        <FixPanel {...props} selectedFix={props.selectedFix || props.issues[0] || null} />
      </div>
    </section>
  );
}

function FixPanel(props: {
  selectedFix: BarrierIssue | null;
  selectedOption: FixOptionKey;
  setSelectedOption: (option: FixOptionKey) => void;
  copyFix: () => void;
  moveIssue: (direction: -1 | 1) => void;
  showToast: (message: string) => void;
}) {
  const issue = props.selectedFix;
  if (!issue) return <div className="fix-detail">No issue selected.</div>;
  return (
    <aside className="fix-detail">
      <SeverityPill severity={issue.severity} />
      <h3>{issue.plain_english}</h3>
      <p>{issue.description}</p>
      <div className="detail-chips">
        <span className={mono.className}>WCAG {issue.wcag_ref}</span>
        <span className={mono.className}>{issue.affected_count} elements</span>
      </div>
      <div className="code-label-row">
        <Label>CODE FIX</Label>
        <div className="option-toggle">
          {(["A", "B", "C"] as const).map((option) => (
            <button
              key={option}
              className={props.selectedOption === option ? "is-selected" : ""}
              type="button"
              onClick={() => props.setSelectedOption(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <CodeBlock label="AFFECTED AREA" tone="before" code={issue.fix_before} />
      <CodeBlock label="SUGGESTED FIX" tone="after" code={fixAfterFor(issue, props.selectedOption)} />
      <p>How users experience this: {issue.users_affected}</p>
      <button className="copy-button" type="button" onClick={props.copyFix}>Copy fix</button>
      <div className="secondary-actions">
        <button className="ghost-button" type="button" onClick={() => props.showToast(`Applied to ${issue.affected_count} similar elements`)}>
          Apply to similar
        </button>
        <button className="ghost-button" type="button" onClick={() => props.moveIssue(1)}>Skip</button>
      </div>
      <footer className="fix-nav">
        <Label>NEXT ISSUE</Label>
        <div>
          <button className="ghost-button" type="button" aria-label="Previous issue" onClick={() => props.moveIssue(-1)}><ArrowLeft size={14} /></button>
          <button className="ghost-button" type="button" aria-label="Next issue" onClick={() => props.moveIssue(1)}><ArrowRight size={14} /></button>
        </div>
      </footer>
    </aside>
  );
}

function GuidedFlow(props: {
  step: DemoStep;
  answers: string[];
  answerQuiz: (answer: string) => void;
  close: () => void;
  openBooking: () => void;
  previewFocus: boolean;
  setPreviewFocus: (enabled: boolean) => void;
  previewZoom: number;
  setPreviewZoom: (zoom: number) => void;
}) {
  const progress = ((props.step + 1) / 4) * 100;
  const currentStep = props.step < 3 ? quizSteps[props.step as 0 | 1 | 2] : null;
  return (
    <div className="flow-backdrop" role="dialog" aria-modal="true" aria-labelledby="flow-title">
      <section className="flow-card">
        <header className="flow-header">
          <div>
            <p className="eyebrow">FOCUS MODE DEMO</p>
            <h2 id="flow-title">{currentStep ? currentStep.question : "Book a Call with Us"}</h2>
          </div>
          <button className="flow-close" type="button" aria-label="Close Focus Mode demo" onClick={props.close}><X size={16} /></button>
        </header>
        <div className="flow-progress" aria-label={`Step ${props.step + 1} of 4`}>
          <span style={{width: `${progress}%`}} />
        </div>
        {currentStep ? (
          <div className="flow-options">
            {currentStep.options.map((option) => (
              <button type="button" key={option} onClick={() => props.answerQuiz(option)}>{option}</button>
            ))}
          </div>
        ) : (
          <div className="flow-final">
            <section>
              <p className="eyebrow">RECOMMENDATION</p>
              <h2>Recommended solution: Focus Mode layer</h2>
              <ul className="recommend-list">
                {[
                  "No full rebuild required",
                  "Cleaner reading experience",
                  "Reduced motion and visual clutter",
                  "Adaptive layer can stay updated as your website changes",
                ].map((item) => (
                  <li key={item}><Check size={15} /> {item}</li>
                ))}
              </ul>
              <p>What you get: a product demo, implementation path, and a practical estimate for adding Focus Mode to your website.</p>
              <button className="primary-button" type="button" onClick={props.openBooking}>Book a Call with Us</button>
            </section>
            <FocusPreview
              enabled={props.previewFocus}
              setEnabled={props.setPreviewFocus}
              zoom={props.previewZoom}
              setZoom={props.setPreviewZoom}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function FocusPreview({
  enabled,
  setEnabled,
  zoom,
  setZoom,
}: {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
}) {
  function changeZoom(delta: number) {
    setZoom(Math.max(80, Math.min(130, zoom + delta)));
  }

  return (
    <section className="preview-shell">
      <div className="preview-top">
        <div>
          <p className="eyebrow">FOCUS MODE PREVIEW</p>
          <h2>Before and after</h2>
        </div>
        <label className="focus-toggle">
          Focus Mode
          <button
            type="button"
            role="switch"
            aria-label="Focus Mode"
            aria-checked={enabled}
            className={enabled ? "is-on" : ""}
            onClick={() => setEnabled(!enabled)}
          >
            <span />
          </button>
        </label>
      </div>
      <div className="preview-stage">
        <div className="preview-scale" style={{transform: `scale(${zoom / 100})`, width: `${10000 / zoom}%`}}>
          {enabled ? <CalmPreview /> : <BusyPreview />}
        </div>
      </div>
      {enabled ? (
        <p className="focus-confirmation">Focus Mode enabled. Visual noise reduced, animations removed, and reading clarity improved.</p>
      ) : null}
      <div className="zoom-controls" aria-label="Preview zoom controls">
        <button type="button" aria-label="Zoom out" onClick={() => changeZoom(-10)}><Minus size={14} /></button>
        <span className={mono.className}>{zoom}%</span>
        <button type="button" aria-label="Zoom in" onClick={() => changeZoom(10)}><Plus size={14} /></button>
        <button type="button" onClick={() => setZoom(100)}>Reset</button>
      </div>
    </section>
  );
}

function BusyPreview() {
  return (
    <div className="busy-preview">
      <div className="busy-grid">
        <div className="busy-block">Promo banner</div>
        <div className="busy-block">Animated carousel</div>
        <div className="busy-video">Video autoplay area</div>
        <div className="busy-block">Newsletter modal</div>
        <div className="busy-copy">
          Dense content, multiple competing calls to action, small labels, and repeated interruptions compete for attention.
        </div>
        <div className="busy-cta">Buy now</div>
        <div className="busy-cta">Learn more</div>
      </div>
    </div>
  );
}

function CalmPreview() {
  return (
    <div className="calm-preview">
      <h3>Simple plan for clearer browsing</h3>
      <p>
        Focus Mode removes visual clutter, pauses motion, increases spacing, and presents the primary action clearly for users
        who prefer a calmer reading experience.
      </p>
      <button type="button">Continue</button>
    </div>
  );
}

function BookingModal({close}: {close: () => void}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="booking-title">
      <section className="modal-card">
        <header className="modal-header">
          <h2 id="booking-title">Book a DocAlly Demo</h2>
          <button type="button" aria-label="Close modal" onClick={close}><X size={16} /></button>
        </header>
        <div className="modal-body">
          <p>See how Focus Mode can be added to your website without rebuilding the full experience.</p>
          <div className="calendar-placeholder">Calendar integration coming soon.</div>
        </div>
      </section>
    </div>
  );
}

function CategoryCard({category, selected, onClick}: {category: IssueCategory; selected?: boolean; onClick: () => void}) {
  return (
    <button className={`category-card ${selected ? "is-selected" : ""}`} type="button" onClick={onClick}>
      <SeverityDot severity={category.severity} />
      <div>
        <h3>{category.name}</h3>
        <p>{category.description}</p>
      </div>
      <span className={`${mono.className} finding-count`}>{category.count} findings</span>
      <strong className={`focus-label ${category.focusModeHelps ? "is-helped" : ""}`}>
        {category.focusModeHelps ? "Focus Mode helps" : "Manual review"}
      </strong>
    </button>
  );
}

function DetailBlock({title, children}: {title: string; children: ReactNode}) {
  return (
    <article className="detail-card">
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}

function SolutionCard({icon, title, children}: {icon: ReactNode; title: string; children: ReactNode}) {
  return (
    <article className="solution-card">
      {icon}
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}

function SeverityDot({severity}: {severity: Severity}) {
  return <span className={`severity-dot ${severity}`} />;
}

function SeverityPill({severity}: {severity: Severity}) {
  return <span className={`${mono.className} severity-pill ${severity}`}>{severity}</span>;
}

function Label({children}: {children: ReactNode}) {
  return <div className="panel-label">{children}</div>;
}

function CodeBlock({label, tone, code}: {label: string; tone: "before" | "after"; code: string}) {
  return (
    <div className={`code-block ${tone}`}>
      <label>{label}</label>
      <pre>{code}</pre>
    </div>
  );
}

function severityMeta(severity: Severity) {
  const meta: Record<Severity, {border: string; pillBg: string; pillText: string; pillBorder: string; label: string; dot: string}> = {
    critical: {
      border: "#C0392B",
      pillBg: "rgba(192,57,43,0.15)",
      pillText: "#E74C3C",
      pillBorder: "rgba(192,57,43,0.3)",
      label: "CRITICAL",
      dot: "#C0392B",
    },
    high: {
      border: "#D68910",
      pillBg: "rgba(214,137,16,0.15)",
      pillText: "#F39C12",
      pillBorder: "rgba(214,137,16,0.3)",
      label: "HIGH",
      dot: "#D68910",
    },
    medium: {
      border: "#4A90D9",
      pillBg: "rgba(74,144,217,0.15)",
      pillText: "#5DADE2",
      pillBorder: "rgba(74,144,217,0.3)",
      label: "MEDIUM",
      dot: "#4A90D9",
    },
    low: {
      border: "#4A4A46",
      pillBg: "rgba(74,74,70,0.15)",
      pillText: "#888580",
      pillBorder: "rgba(74,74,70,0.3)",
      label: "LOW",
      dot: "#4A4A46",
    },
  };

  return meta[severity];
}

function issueCounts(issues: BarrierIssue[]) {
  return {
    total: issues.length,
    critical: issues.filter((issue) => issue.severity === "critical" && issueStatus(issue) !== "fixed").length,
    high: issues.filter((issue) => issue.severity === "high" && issueStatus(issue) !== "fixed").length,
    medium: issues.filter((issue) => issue.severity === "medium" && issueStatus(issue) !== "fixed").length,
    low: issues.filter((issue) => issue.severity === "low" && issueStatus(issue) !== "fixed").length,
    fixed: issues.filter((issue) => issueStatus(issue) === "fixed").length,
  };
}

function barrierShortName(barrier: BarrierNumber) {
  const names: Record<BarrierNumber, string> = {
    1: "Motion",
    2: "Color",
    3: "Language",
    4: "Navigation",
    5: "Clutter",
    6: "Time",
  };
  return names[barrier];
}

function impactMeta(count: number) {
  if (count > 1000) return {key: "massive", label: "MASSIVE"};
  if (count >= 201) return {key: "large", label: "LARGE"};
  if (count >= 51) return {key: "medium", label: "MEDIUM"};
  if (count >= 11) return {key: "small", label: "SMALL"};
  return {key: "minimal", label: "MINIMAL"};
}

function impactLabelForCategory(category: IssueCategory) {
  if (category.count >= 20 || category.severity === "critical" || category.severity === "high") return "High impact";
  if (category.count > 0 || category.severity === "medium") return "Medium impact";
  return "Low impact";
}

function actionLabelForCategory(category: IssueCategory) {
  const labels: Record<string, string> = {
    "visual-overload": "Highlight areas",
    "reading-clarity": "Review finding",
    "motion-animation": "Preview fix",
    "navigation-complexity": "Review paths",
    "screen-reader-support": "Review support",
  };
  return labels[category.id] || "Review issue";
}

function solutionLabelForCategory(category: IssueCategory) {
  if (category.id === "navigation-complexity") return "Structure improvements help";
  return category.focusModeHelps ? "Focus Mode helps" : "Technical fixes help";
}

function fineExposureMeta(severity: Severity) {
  const values: Record<Severity, {row: string; panel: string; color: string}> = {
    critical: {row: "€80K-500K", panel: "Up to €500,000", color: "#E74C3C"},
    high: {row: "€20K-80K", panel: "Up to €80,000", color: "#F39C12"},
    medium: {row: "€5K-20K", panel: "Up to €20,000", color: "#5DADE2"},
    low: {row: "€0-5K", panel: "Up to €5,000", color: "#888580"},
  };
  return values[severity];
}

function affectedCountClass(count: number) {
  if (count > 500) return "is-serious";
  if (count > 100) return "is-notable";
  return "";
}

function issueStatus(issue: BarrierIssue) {
  return issue.status === "fixed" ? "fixed" : "open";
}

function sortIssuesForTab(issues: BarrierIssue[], tab: IssueTabKey) {
  if (tab === "fixed") {
    return issues
      .filter((issue) => issueStatus(issue) === "fixed")
      .sort((a, b) => Date.parse(b.resolved_at || "") - Date.parse(a.resolved_at || ""));
  }

  const openIssues = issues.filter((issue) => issueStatus(issue) !== "fixed");
  const filtered = tab === "all" ? openIssues : openIssues.filter((issue) => issue.severity === tab);
  return filtered.sort(compareIssues);
}

function groupIssuesByBarrier(issues: BarrierIssue[]) {
  const order: BarrierNumber[] = [1, 2, 3, 4, 5, 6];
  return order
    .map((barrier) => ({
      barrier,
      issues: issues.filter((issue) => issue.barrier === barrier).sort(compareIssues),
    }))
    .filter((group) => group.issues.length > 0);
}

function compareIssues(a: BarrierIssue, b: BarrierIssue) {
  const severityWeight: Record<Severity, number> = {critical: 0, high: 1, medium: 2, low: 3};
  if (severityWeight[a.severity] !== severityWeight[b.severity]) return severityWeight[a.severity] - severityWeight[b.severity];
  return b.affected_count - a.affected_count;
}

function buildIssueCategories(result: BarrierScanResult): IssueCategory[] {
  const allIssues = Object.values(result.issuesByBarrier).flat();
  const pick = (matcher: RegExp, barriers: BarrierNumber[]) =>
    allIssues.filter((issue) => barriers.includes(issue.barrier) || matcher.test(issue.type));

  const visual = pick(/color|contrast|sensory|font|clutter|decor/i, [2, 5]);
  const reading = pick(/language|jargon|passive|cognitive|vague/i, [3]);
  const motion = pick(/animation|motion|transition|video|audio/i, [1]);
  const navigation = pick(/skip|heading|nav|popup|timer|redirect|timeout/i, [4, 6]);
  const screenReader = pick(/alt|aria|label|lang|screen/i, [5]);

  return [
    {
      id: "visual-overload",
      name: "Visual overload",
      severity: severityForIssues(visual),
      count: visual.length,
      description: "Busy layouts, intense color, and competing sections can increase cognitive effort.",
      experience: "Users may struggle to decide where to look first or what action matters most.",
      why: "Clear hierarchy lowers mental effort and helps more visitors complete the intended task.",
      recommendation: "Use Focus Mode to reduce visual noise and present one clear path through the page.",
      focusModeHelps: true,
      issues: visual,
    },
    {
      id: "reading-clarity",
      name: "Reading clarity",
      severity: severityForIssues(reading),
      count: reading.length,
      description: "Dense, vague, or jargon-heavy copy can make the site harder to understand.",
      experience: "Users who prefer literal language may need extra time to interpret labels and next steps.",
      why: "Clear language makes decisions faster and reduces avoidable support or abandonment.",
      recommendation: "Use simpler copy and Focus Mode spacing to make the primary message easier to scan.",
      focusModeHelps: true,
      issues: reading,
    },
    {
      id: "motion-animation",
      name: "Motion and animation",
      severity: severityForIssues(motion),
      count: motion.length,
      description: "Motion can distract users who prefer a calmer reading experience.",
      experience: "Users may lose focus, feel discomfort, or miss important content while motion competes for attention.",
      why: "Reduced motion support gives users control without removing the experience for everyone.",
      recommendation: "Focus Mode can pause non-essential motion and prioritize static content.",
      focusModeHelps: true,
      issues: motion,
    },
    {
      id: "navigation-complexity",
      name: "Navigation complexity",
      severity: severityForIssues(navigation),
      count: navigation.length,
      description: "Unexpected interactions or unclear structure can make browsing feel unpredictable.",
      experience: "Users may hesitate, backtrack, or abandon flows when navigation changes without warning.",
      why: "Predictable navigation helps people understand where they are and what happens next.",
      recommendation: "Use Focus Mode to simplify navigation choices and keep technical fixes for structural issues.",
      focusModeHelps: true,
      issues: navigation,
    },
    {
      id: "screen-reader-support",
      name: "Screen reader support",
      severity: severityForIssues(screenReader),
      count: screenReader.length,
      description: "Missing labels and descriptions can block assistive technology users.",
      experience: "Screen reader users may hear vague controls or miss important image and form context.",
      why: "Semantic labels are essential for access and should be remediated in code.",
      recommendation: "Use technical remediation for labels and descriptions; Focus Mode can support the visual experience around it.",
      focusModeHelps: false,
      issues: screenReader,
    },
  ];
}

function severityForIssues(issues: BarrierIssue[]): Severity {
  if (issues.some((issue) => issue.severity === "critical")) return "critical";
  if (issues.some((issue) => issue.severity === "high")) return "high";
  if (issues.some((issue) => issue.severity === "medium")) return "medium";
  return "low";
}

function scoreColorFor(score: number): string {
  if (score <= 40) return "#C0392B";
  if (score <= 70) return "#D68910";
  return "#1E8449";
}

function riskLevelFor(result: BarrierScanResult): "Low" | "Medium" | "High" {
  if (result.summary.critical > 0 || result.score <= 45) return "High";
  if (result.summary.high > 3 || result.score <= 70) return "Medium";
  return "Low";
}

function fixAfterFor(issue: BarrierIssue, option: FixOptionKey) {
  if (option === "A") return issue.fix_after;
  return issue.fixOptions?.[option] || issue.fix_after;
}

function safeHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url || "Scanned site";
  }
}
