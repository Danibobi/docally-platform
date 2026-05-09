import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { BentoCard } from "@/components/bento-card";
import { MobileAIButton } from "@/components/mobile-ai-button";
import { attentionIssues, fixGroups, scanSummary } from "@/data/issues";

export const Route = createFileRoute("/solution")({
  head: () => ({
    meta: [
      { title: "Your accessibility solution — BridgeDoc" },
      {
        name: "description",
        content:
          "A prioritized implementation plan grouped by contrast, keyboard, screen reader, forms, and semantic structure.",
      },
      { property: "og:title", content: "Your accessibility solution — BridgeDoc" },
      {
        property: "og:description",
        content: "Turn findings into implementation steps your team can ship.",
      },
    ],
  }),
  component: SolutionPage,
});

function SolutionPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-20 pt-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-foreground/60">
            Implementation plan
          </p>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl">
            Ship the fixes, in order.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            We grouped your {scanSummary.metrics.fixes} findings into five fix
            packages. Tackle them top to bottom for the fastest score lift.
          </p>
        </div>
        <Link
          to="/book"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
        >
          Book a call <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {fixGroups.map((group, i) => {
          const items = attentionIssues.filter((it) => it.group === group.id);
          return (
            <BentoCard
              key={group.id}
              radius={i % 2 === 0 ? "organic-a" : "organic-b"}
              gradient={group.gradient}
              className="p-6"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-foreground/60">
                Package {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-1 font-display text-2xl leading-tight">
                {group.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {group.summary}
              </p>

              <ul className="mt-4 space-y-2">
                {items.map((issue) => (
                  <li
                    key={issue.slug}
                    className="rounded-2xl border border-border/60 bg-card/80 p-3"
                  >
                    <div className="flex items-start gap-2">
                      <CheckCircle2
                        className="mt-0.5 size-4 text-foreground/70"
                        aria-hidden
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-tight">
                          {issue.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {issue.implementations[0]}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="rounded-2xl border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                    No findings in this package.
                  </li>
                )}
              </ul>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {items.length} {items.length === 1 ? "fix" : "fixes"}
                </span>
                <Link
                  to="/code-fix"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline"
                >
                  Code fixes <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </BentoCard>
          );
        })}
      </div>

      <MobileAIButton initialContext={{ view: "solution", scan: scanSummary }} />
    </main>
  );
}
