import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ListChecks,
  ClipboardList,
  Wrench,
  Code2,
  CalendarCheck,
} from "lucide-react";
import { BentoCard } from "@/components/bento-card";
import { MobileAIButton } from "@/components/mobile-ai-button";
import { SeverityPill, WcagPill, ImpactPill } from "@/components/pills";
import { attentionIssues, scanSummary, type Issue } from "@/data/issues";
import { useScanStore } from "@/stores/scan-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Scan results — BridgeDoc" },
      {
        name: "description",
        content:
          "Your accessibility score with prioritized issues and AI-guided implementation steps.",
      },
      { property: "og:title", content: "Scan results — BridgeDoc" },
      {
        property: "og:description",
        content: "Score, issue cards, and step-by-step fixes.",
      },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const url = useScanStore((s) => s.url);

  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-20 pt-6 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-10">
        <div className="space-y-5 lg:col-span-7">
          <ScoreSection url={url} />
          <ActionPanel className="lg:hidden" />
          <AttentionSection />
        </div>
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24">
            <ActionPanel />
          </div>
        </aside>
      </div>
      <MobileAIButton
        initialContext={{ scan: scanSummary, url, issues: attentionIssues }}
      />
    </main>
  );
}

function ScoreSection({ url }: { url: string }) {
  const { score, label, summary, metrics } = scanSummary;

  return (
    <section className="grid gap-5 sm:grid-cols-5">
      <BentoCard
        radius="lg"
        gradient="peach"
        className="p-7 sm:col-span-3 sm:p-9"
      >
        <p className="text-xs font-medium uppercase tracking-wider text-foreground/70">
          Accessibility score
        </p>
        <div className="mt-3 flex items-end gap-3">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
            className="font-display text-7xl leading-none sm:text-8xl"
          >
            {score}
          </motion.div>
          <span className="pb-2 text-xl text-foreground/70">/ 100</span>
        </div>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-foreground/10 px-2.5 py-1 text-xs font-medium">
          <span className="size-1.5 rounded-full bg-foreground" /> {label}
        </span>
        <p className="mt-4 max-w-md text-sm text-foreground/80">{summary}</p>
        {url && (
          <p className="mt-3 truncate text-xs text-foreground/60">
            Scanned: {url}
          </p>
        )}
      </BentoCard>

      <div className="grid grid-cols-2 gap-3 sm:col-span-2">
        <Metric label="Critical" value={metrics.critical} grad="blush" />
        <Metric label="High" value={metrics.high} grad="peach" />
        <Metric label="Medium" value={metrics.medium} grad="lemon" />
        <Metric label="Low" value={metrics.low} grad="mint" />
        <BentoCard
          gradient="lavender"
          radius="organic-a"
          className="col-span-2 p-5"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-card">
              <ListChecks className="size-5" aria-hidden />
            </div>
            <div>
              <p className="font-display text-2xl">{metrics.fixes} Fixes</p>
              <p className="text-xs text-muted-foreground">available now</p>
            </div>
          </div>
        </BentoCard>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  grad,
}: {
  label: string;
  value: number;
  grad: "mint" | "peach" | "lemon" | "blush";
}) {
  return (
    <BentoCard radius="sm" gradient={grad} className="p-4">
      <p className="text-xs font-medium text-foreground/70">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </BentoCard>
  );
}

function ActionPanel({ className }: { className?: string }) {
  const actions = [
    {
      to: "/quiz",
      title: "Start quiz",
      body: "Prioritize fixes for your company size, industry, and user flows.",
      cta: "Start quiz",
      icon: <ClipboardList className="size-4" aria-hidden />,
      gradient: "lime-bold" as const,
    },
    {
      to: "/solution",
      title: "Get solution",
      body: "Turn findings into implementation steps and accessible UI requirements.",
      cta: "View solution",
      icon: <Wrench className="size-4" aria-hidden />,
      gradient: "mint" as const,
    },
    {
      to: "/code-fix",
      title: "Get code fix",
      body: "Generate code-level recommendations your team can copy into tickets.",
      cta: "Generate code fix",
      icon: <Code2 className="size-4" aria-hidden />,
      gradient: "lavender" as const,
    },
    {
      to: "/book",
      title: "Book a call",
      body: "Review the results with us and plan your accessibility package.",
      cta: "Book a call",
      icon: <CalendarCheck className="size-4" aria-hidden />,
      gradient: "peach" as const,
    },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {actions.map((a) => (
        <BentoCard
          key={a.to}
          radius="sm"
          gradient={a.gradient}
          className="p-5"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-card shadow-bento-sm">
              {a.icon}
            </span>
            <div className="flex-1">
              <p className="font-display text-xl leading-tight">{a.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{a.body}</p>
              <Link
                to={a.to}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-transform hover:scale-[1.02]"
              >
                {a.cta} <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </BentoCard>
      ))}
    </div>
  );
}

function AttentionSection() {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl">
            What needs attention
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose an issue to focus on and review the implementation steps.
          </p>
        </div>
        <span className="rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs text-foreground/70">
          {attentionIssues.length} issues
        </span>
      </div>

      <div
        className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 sm:grid-cols-4"
        style={{ gridAutoFlow: "dense" }}
      >
        {attentionIssues.map((issue, i) => (
          <IssueCard key={issue.slug} issue={issue} index={i} />
        ))}
      </div>
    </section>
  );
}

const layoutSpan: Record<NonNullable<Issue["layoutClass"]>, string> = {
  "card-large": "sm:col-span-2 sm:row-span-2",
  "card-tall": "sm:col-span-2 sm:row-span-2",
  "card-wide": "sm:col-span-2",
};

function IssueCard({ issue, index }: { issue: Issue; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "sm:col-span-2",
        issue.layoutClass && layoutSpan[issue.layoutClass],
      )}
    >
      <BentoCard
        radius={index % 2 === 0 ? "organic-a" : "organic-b"}
        gradient={issue.gradient}
        className="flex h-full flex-col p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-card text-xl font-semibold shadow-bento-sm">
            <span aria-hidden>{issue.icon}</span>
          </div>
          <SeverityPill severity={issue.severity} />
        </div>

        <h3 className="mt-5 font-display text-2xl leading-tight">
          {issue.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{issue.description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <WcagPill wcag={issue.wcag} />
          <ImpactPill impact={issue.impact} />
        </div>

        <div className="mt-auto pt-5">
          <Link
            to="/focus/$slug"
            params={{ slug: issue.slug }}
            className="group inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
          >
            Get fix
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </BentoCard>
    </motion.div>
  );
}
