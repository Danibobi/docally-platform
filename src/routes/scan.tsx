import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ArrowRight, Globe } from "lucide-react";
import { useScanStore } from "@/stores/scan-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan a site — BridgeDoc" },
      {
        name: "description",
        content:
          "What site are we fixing today? Paste a URL and we'll scan it for accessibility issues and ship-ready code fixes.",
      },
      { property: "og:title", content: "Scan a site — BridgeDoc" },
      {
        property: "og:description",
        content:
          "Accessibility intelligence for developers. Scan a single page or a full site.",
      },
    ],
  }),
  component: ScanPage,
});

const EXAMPLES = ["apple.com", "bmw.com", "pwc.com"];

const schema = z
  .string()
  .trim()
  .min(1, "Enter a website URL")
  .refine(
    (v) => {
      try {
        const u = new URL(v.startsWith("http") ? v : `https://${v}`);
        return !!u.hostname.includes(".");
      } catch {
        return false;
      }
    },
    { message: "That doesn't look like a valid URL" },
  );

function ScanPage() {
  const navigate = useNavigate();
  const setScan = useScanStore((s) => s.setScan);
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"single" | "full">("single");

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const parsed = schema.safeParse(url);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setScan(parsed.data, mode === "full" ? "Full site scan." : "");
    navigate({ to: "/scanning" });
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col bg-background text-foreground">
      {/* Headline + form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <p className="text-sm text-muted-foreground">
          Accessibility intelligence for developers
        </p>
        <h1 className="mt-4 text-center font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-[68px]">
          What site are we fixing today?
        </h1>

        <form
          onSubmit={submit}
          className="mt-12 w-full max-w-3xl rounded-full border border-border bg-card px-3 py-2 shadow-bento-sm focus-within:border-foreground/30"
        >
          <div className="flex items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground">
              <Globe className="size-5" aria-hidden />
            </span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              inputMode="url"
              autoFocus
              aria-label="Website URL"
              className="flex-1 bg-transparent py-2 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:text-lg"
            />

            <div
              className="hidden items-center gap-1 rounded-full bg-foreground/[0.04] p-1 text-xs sm:flex"
              role="tablist"
              aria-label="Scan scope"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "single"}
                onClick={() => setMode("single")}
                className={cn(
                  "rounded-full px-3 py-1.5 font-medium transition-colors",
                  mode === "single"
                    ? "bg-card text-foreground shadow-bento-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Single page
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "full"}
                onClick={() => setMode("full")}
                className={cn(
                  "rounded-full px-3 py-1.5 font-medium transition-colors",
                  mode === "full"
                    ? "bg-card text-foreground shadow-bento-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Full site
              </button>
            </div>

            <button
              type="submit"
              className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Scan <ArrowRight className="size-4" aria-hidden />
            </button>
          </div>
        </form>

        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground">Try an example →</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setUrl(`https://${ex}`)}
                className="rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pb-8 text-center text-[11px] text-muted-foreground/70">
        Press Enter to scan · Esc to go back
      </div>
    </div>
  );
}
