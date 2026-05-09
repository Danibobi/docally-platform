import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { BentoCard } from "@/components/bento-card";
import { useQuizStore } from "@/stores/quiz-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Accessibility quiz — BridgeDoc" },
      {
        name: "description",
        content:
          "Answer five quick questions and we'll prioritize fixes for your company size, industry, and user flows.",
      },
      { property: "og:title", content: "Accessibility quiz — BridgeDoc" },
      {
        property: "og:description",
        content:
          "A 5-question quiz that returns a personalized accessibility roadmap.",
      },
    ],
  }),
  component: QuizPage,
});

type Question = {
  id: string;
  prompt: string;
  hint: string;
  options: string[];
};

const QUESTIONS: Question[] = [
  {
    id: "size",
    prompt: "How big is your company?",
    hint: "We use this to calibrate effort and rollout speed.",
    options: [
      "Solo / small team",
      "10–50 employees",
      "50–250 employees",
      "250+ employees",
    ],
  },
  {
    id: "niche",
    prompt: "What niche are you working in?",
    hint: "Different industries face different WCAG and EU requirements.",
    options: [
      "SaaS",
      "E-commerce",
      "Healthcare",
      "Education",
      "Finance",
      "Agency / client work",
      "Public sector",
      "Other",
    ],
  },
  {
    id: "flow",
    prompt: "What is your most important user flow?",
    hint: "We'll prioritize fixes that protect this flow first.",
    options: [
      "Signup",
      "Checkout",
      "Dashboard",
      "Booking",
      "Content / reading",
      "Support",
      "Internal tools",
    ],
  },
  {
    id: "need",
    prompt: "What do you need most?",
    hint: "Pick the deliverable that would help your team this quarter.",
    options: [
      "Audit report",
      "Code fixes",
      "Design system fixes",
      "Developer tickets",
      "EU compliance guidance",
      "Training for the team",
    ],
  },
  {
    id: "urgency",
    prompt: "How urgent is this?",
    hint: "We'll match the recommendation to your timeline.",
    options: ["Exploring", "This quarter", "This month", "Immediately"],
  },
];

function QuizPage() {
  const { answers, setAnswer } = useQuizStore();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const total = QUESTIONS.length;
  const current = QUESTIONS[step];
  const selected = answers[current?.id ?? ""];

  const next = () => {
    if (step < total - 1) setStep((s) => s + 1);
    else setDone(true);
  };

  if (done) return <RoadmapView />;

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-20 pt-6 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-foreground/60">
          Personalize your roadmap
        </p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">
          A few quick questions.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          We'll tailor your accessibility plan to your team, industry, and
          urgency.
        </p>
      </div>

      <div className="mb-5 flex items-center gap-1.5">
        {QUESTIONS.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-foreground" : "bg-foreground/15",
            )}
          />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BentoCard radius="lg" gradient="mint" className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22 }}
              >
                <p className="text-xs text-muted-foreground">
                  Question {step + 1} of {total}
                </p>
                <h2 className="mt-1 font-display text-3xl sm:text-4xl">
                  {current.prompt}
                </h2>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {current.options.map((opt) => {
                    const active = selected === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setAnswer(current.id, opt)}
                        className={cn(
                          "rounded-2xl border p-4 text-left text-sm font-medium transition-all",
                          active
                            ? "border-foreground bg-primary text-primary-foreground shadow-bento-sm"
                            : "border-border/60 bg-card/80 hover:border-foreground/30 hover:bg-card",
                        )}
                        aria-pressed={active}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>{opt}</span>
                          {active && (
                            <CheckCircle2 className="size-4" aria-hidden />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={step === 0}
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowLeft className="size-4" /> Back
                  </button>
                  <button
                    type="button"
                    disabled={!selected}
                    onClick={next}
                    className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity disabled:opacity-30"
                  >
                    {step === total - 1 ? "See roadmap" : "Next"}
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </BentoCard>
        </div>

        <aside className="space-y-4">
          <BentoCard radius="organic-a" gradient="lavender" className="p-5">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-foreground/60">
              <Sparkles className="size-3.5" /> Why we ask
            </div>
            <p className="mt-2 text-sm">{current.hint}</p>
          </BentoCard>

          <BentoCard radius="organic-b" gradient="sage" className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-foreground/60">
              So far
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {QUESTIONS.slice(0, step + 1).map((q) => (
                <li key={q.id} className="flex items-start gap-2">
                  <CheckCircle2
                    className={cn(
                      "mt-0.5 size-4",
                      answers[q.id]
                        ? "text-foreground"
                        : "text-foreground/30",
                    )}
                    aria-hidden
                  />
                  <span className="flex-1">
                    <span className="block text-xs text-muted-foreground">
                      {q.prompt}
                    </span>
                    <span className="font-medium">
                      {answers[q.id] ?? "—"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </BentoCard>
        </aside>
      </div>
    </main>
  );
}

function RoadmapView() {
  const { answers, reset } = useQuizStore();

  const recommendations = [
    {
      title: "Start with critical WCAG blockers",
      body: `Based on a ${answers.size?.toLowerCase() ?? "small"} team, fix the 2 critical findings first to unblock screen reader users.`,
    },
    {
      title: "Fix contrast and focus states first",
      body: `These changes ship in days and immediately help your ${answers.flow?.toLowerCase() ?? "primary"} flow.`,
    },
    {
      title: "Package issues into developer-ready tasks",
      body: `Use the code-fix snippets to open ${answers.need === "Developer tickets" ? "tickets" : "tickets or PRs"} your team can review and release.`,
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
      <BentoCard radius="lg" gradient="lime-bold" className="p-8 sm:p-12">
        <p className="text-xs font-medium uppercase tracking-wider text-foreground/70">
          Roadmap ready
        </p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">
          Your accessibility roadmap is ready.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-foreground/80">
          Here's where to start, based on your answers.
        </p>
      </BentoCard>

      <ol className="mt-5 space-y-3">
        {recommendations.map((r, i) => (
          <li key={i}>
            <BentoCard
              radius={i % 2 === 0 ? "organic-a" : "organic-b"}
              gradient={(["mint", "peach", "lavender"] as const)[i]}
              className="p-5"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">
                  {i + 1}
                </span>
                <div>
                  <p className="font-display text-2xl leading-tight">
                    {r.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                </div>
              </div>
            </BentoCard>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/book"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
        >
          Book a call <ArrowRight className="size-4" />
        </Link>
        <button
          onClick={reset}
          className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium"
        >
          Retake quiz
        </button>
      </div>
    </main>
  );
}
