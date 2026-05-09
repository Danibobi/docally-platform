import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { BentoCard } from "@/components/bento-card";
import { useScanStore } from "@/stores/scan-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scanning")({
  head: () => ({
    meta: [
      { title: "Scanning your website — BridgeDoc" },
      {
        name: "description",
        content:
          "Running an accessibility audit across contrast, keyboard, semantics, screen reader support, and code fixes.",
      },
    ],
  }),
  component: ScanningPage,
});

const STEPS = [
  "Loading page",
  "Checking contrast",
  "Testing keyboard navigation",
  "Reading semantic structure",
  "Reviewing screen reader support",
  "Preparing code fixes",
  "Building accessibility package",
];

function ScanningPage() {
  const navigate = useNavigate();
  const url = useScanStore((s) => s.url);
  const setStatus = useScanStore((s) => s.setStatus);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!url) {
      navigate({ to: "/scan" });
      return;
    }
    const interval = setInterval(() => {
      setStep((s) => {
        if (s >= STEPS.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            setStatus("done");
            navigate({ to: "/results" });
          }, 600);
          return s;
        }
        return s + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [url, navigate, setStatus]);

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-3xl items-center px-4 py-10 sm:px-6">
      <BentoCard radius="lg" gradient="mint" className="w-full p-8 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-card shadow-bento-sm">
            <Loader2 className="size-6 animate-spin text-foreground" aria-hidden />
          </div>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl">
            Scanning your website
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            We're checking contrast, navigation, semantic structure, focus
            states, screen reader support — then packaging fixes.
          </p>
          {url && (
            <p className="mt-2 truncate text-xs text-foreground/60">{url}</p>
          )}
        </motion.div>

        <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <motion.div
            className="h-full rounded-full bg-foreground"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <ul className="mt-8 space-y-2.5">
          {STEPS.map((label, i) => {
            const state =
              i < step ? "done" : i === step ? "active" : "pending";
            return (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-border/60 px-4 py-3 transition-colors",
                  state === "active" && "bg-card shadow-bento-sm",
                  state === "done" && "bg-card/60",
                  state === "pending" && "bg-card/30 text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full text-xs font-semibold",
                    state === "done" && "bg-primary text-primary-foreground",
                    state === "active" && "bg-foreground text-background",
                    state === "pending" && "bg-foreground/10 text-foreground/40",
                  )}
                  aria-hidden
                >
                  {state === "done" ? (
                    <Check className="size-3.5" />
                  ) : state === "active" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </motion.li>
            );
          })}
        </ul>
      </BentoCard>
    </main>
  );
}
