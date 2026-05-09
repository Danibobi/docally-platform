import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { BentoCard } from "@/components/bento-card";
import { MobileAIButton } from "@/components/mobile-ai-button";
import { codeFixes } from "@/data/code-fixes";
import { toast } from "sonner";

export const Route = createFileRoute("/code-fix")({
  head: () => ({
    meta: [
      { title: "Code fixes — BridgeDoc" },
      {
        name: "description",
        content:
          "Copy-ready accessibility code fixes your team can drop into tickets or pull requests.",
      },
      { property: "og:title", content: "Code fixes — BridgeDoc" },
      {
        property: "og:description",
        content: "Snippets for contrast, focus, labels, modals, and more.",
      },
    ],
  }),
  component: CodeFixPage,
});

function CodeFixPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-20 pt-6 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-foreground/60">
          Code fixes
        </p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">
          Copy-ready accessibility fixes.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Drop these into tickets or pull requests. Each card explains the
          problem, the fix, and the snippet to ship.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {codeFixes.map((fix, i) => (
          <FixCard key={fix.id} fix={fix} index={i} />
        ))}
      </div>

      <MobileAIButton initialContext={{ view: "code-fix" }} />
    </main>
  );
}

function FixCard({
  fix,
  index,
}: {
  fix: (typeof import("@/data/code-fixes").codeFixes)[number];
  index: number;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fix.snippet);
      setCopied(true);
      toast.success("Snippet copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <BentoCard
      radius={index % 2 === 0 ? "organic-a" : "organic-b"}
      gradient={fix.gradient}
      className="flex h-full flex-col p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-2xl leading-tight">{fix.title}</h2>
        <span className="rounded-full bg-foreground/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider">
          {fix.language}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-foreground/60">
            Problem
          </p>
          <p className="mt-1 text-sm text-foreground/80">{fix.problem}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-foreground/60">
            Suggested fix
          </p>
          <p className="mt-1 text-sm text-foreground/80">{fix.fix}</p>
        </div>
      </div>

      <div className="relative mt-4 flex-1">
        <pre className="overflow-x-auto rounded-2xl bg-foreground/[0.06] p-4 text-xs leading-relaxed">
          <code>{fix.snippet}</code>
        </pre>
        <button
          onClick={copy}
          className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-bento-sm hover:bg-accent"
          aria-label="Copy snippet"
        >
          {copied ? (
            <>
              <Check className="size-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Copy
            </>
          )}
        </button>
      </div>
    </BentoCard>
  );
}
