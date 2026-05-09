import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Copy, Sparkles } from "lucide-react";
import { BentoCard } from "@/components/bento-card";
import { SeverityPill, WcagPill, ImpactPill } from "@/components/pills";
import { AIAssistant } from "@/components/ai-assistant";
import { MobileAIButton } from "@/components/mobile-ai-button";
import { attentionIssues, scanSummary, type Issue } from "@/data/issues";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/focus/$slug")({
  loader: ({ params }) => {
    const issue = attentionIssues.find((i) => i.slug === params.slug);
    if (!issue) throw notFound();
    return { issue };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.issue.title} — Focus mode`
          : "Focus mode — a11y.lab",
      },
      {
        name: "description",
        content:
          loaderData?.issue.description ??
          "Step-by-step accessibility fix in focus mode.",
      },
      {
        property: "og:title",
        content: loaderData
          ? `${loaderData.issue.title} — a11y.lab`
          : "Focus mode — a11y.lab",
      },
      {
        property: "og:description",
        content:
          loaderData?.issue.description ??
          "Step-by-step accessibility fix in focus mode.",
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="font-display text-5xl">Issue not found</h1>
      <p className="mt-3 text-muted-foreground">
        We couldn't find that focus topic.
      </p>
      <Link
        to="/results"
        className="mt-6 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
      >
        Back to results
      </Link>
    </main>
  ),
  component: FocusPage,
});

function FocusPage() {
  const { issue } = Route.useLoaderData() as { issue: Issue };
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [fixed, setFixed] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-20 pt-6 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-10">
        <div className="space-y-5 lg:col-span-7">
          <BentoCard
            radius="lg"
            gradient={issue.gradient}
            className="p-7 sm:p-10"
          >
            <Link
              to="/results"
              className="inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> Back to results
            </Link>

            <div className="mt-5 flex items-start justify-between gap-4">
              <div className="grid size-14 place-items-center rounded-3xl bg-card text-2xl font-semibold shadow-bento-sm">
                <span aria-hidden>{issue.icon}</span>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <SeverityPill severity={issue.severity} />
                <WcagPill wcag={issue.wcag} />
                <ImpactPill impact={issue.impact} />
              </div>
            </div>

            <h1 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">
              {issue.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              {issue.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setFixed((f) => !f);
                  toast.success(fixed ? "Marked as open" : "Marked as fixed");
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                  fixed
                    ? "bg-foreground text-background"
                    : "bg-primary text-primary-foreground",
                )}
              >
                <Check className="size-4" />
                {fixed ? "Marked as fixed" : "Mark as fixed"}
              </button>
            </div>
          </BentoCard>

          <div className="grid gap-5 md:grid-cols-2">
            <BentoCard radius="organic-a" gradient="sage" className="p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-foreground/60">
                Questions to answer
              </p>
              <h2 className="mt-1 font-display text-2xl">Get clarity first</h2>
              <ul className="mt-4 space-y-2.5">
                {issue.questions.map((q, i) => (
                  <li key={i}>
                    <button
                      onClick={() =>
                        setDone((d) => ({ ...d, [i]: !d[i] }))
                      }
                      className="group flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 text-left text-sm transition-colors hover:bg-card"
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors",
                          done[i]
                            ? "border-foreground bg-foreground text-background"
                            : "border-foreground/30",
                        )}
                        aria-hidden
                      >
                        {done[i] && <Check className="size-3" />}
                      </span>
                      <span
                        className={cn(
                          done[i] && "text-muted-foreground line-through",
                        )}
                      >
                        {q}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </BentoCard>

            <BentoCard radius="organic-b" gradient="lemon" className="p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-foreground/60">
                Implementation steps
              </p>
              <h2 className="mt-1 font-display text-2xl">Apply the fix</h2>
              <ol className="mt-4 space-y-2.5">
                {issue.implementations.map((step, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 text-sm"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">
                      {i + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                    <button
                      onClick={() => copy(step)}
                      className="rounded-md p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Copy step"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </motion.li>
                ))}
              </ol>
            </BentoCard>
          </div>

          <BentoCard radius="lg" className="p-6">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-foreground/60">
              <Sparkles className="size-3.5" /> Suggested snippet
            </div>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-foreground/[0.04] p-4 text-xs leading-relaxed">
              <code>{issue.codeSnippet}</code>
            </pre>
          </BentoCard>
        </div>

        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24">
            <AIAssistant
              initialContext={{
                scan: scanSummary,
                focus: {
                  title: issue.title,
                  severity: issue.severity,
                  wcag: issue.wcag,
                  description: issue.description,
                },
              }}
              initialPrompt={`Help me fix: ${issue.title}`}
            />
          </div>
        </aside>
      </div>

      <MobileAIButton
        initialContext={{
          scan: scanSummary,
          focus: { title: issue.title, severity: issue.severity, wcag: issue.wcag },
        }}
      />
    </main>
  );
}

