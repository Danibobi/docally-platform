import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Shield,
  ScanSearch,
  Wrench,
  Rocket,
  FileText,
  Brain,
  Users,
  Building2,
  MessagesSquare,
} from "lucide-react";
import { BentoCard } from "@/components/bento-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BridgeDoc — Scan, fix, and ship accessibility improvements" },
      {
        name: "description",
        content:
          "BridgeDoc scans your site, maps WCAG issues, suggests code fixes, and helps your team ship accessibility improvements faster.",
      },
      {
        property: "og:title",
        content: "BridgeDoc — Scan, fix, and ship accessibility improvements",
      },
      {
        property: "og:description",
        content:
          "An AI accessibility agent that finds issues, suggests code fixes, and helps you ship EU-ready experiences.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      {/* Hero */}
      <section className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <BentoCard radius="lg" gradient="lemon" className="p-8 sm:p-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-foreground/70 backdrop-blur">
              <Sparkles className="size-3" aria-hidden /> AI accessibility agent
            </span>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Scan, fix, and ship
              <span className="italic"> accessibility improvements.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              BridgeDoc scans your site, maps WCAG issues, suggests code fixes,
              and helps your team ship accessibility improvements faster — and
              EU-ready.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/scan"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-bento-sm transition-transform hover:scale-[1.02]"
              >
                Start scanning
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-6 py-3 text-sm font-medium text-foreground hover:bg-card"
              >
                See how it works
              </a>
            </div>
          </BentoCard>
        </div>

        <div className="grid gap-5 lg:col-span-4">
          <BentoCard radius="organic-a" gradient="mint" className="p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-foreground/60">
              Sample score
            </p>
            <div className="mt-4 flex items-end justify-between">
              <div className="font-display text-6xl">72</div>
              <div className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium">
                / 100
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Score across contrast, keyboard, semantics, and screen reader
              support.
            </p>
          </BentoCard>

          <BentoCard radius="organic-b" gradient="lavender" className="p-6">
            <Shield className="size-5 text-foreground/70" aria-hidden />
            <p className="mt-3 font-display text-2xl leading-tight">
              EU compliance ready
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Aligned with WCAG 2.2 and the European Accessibility Act.
            </p>
          </BentoCard>
        </div>
      </section>

      {/* Process */}
      <section id="how" className="mt-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-foreground/60">
              Workflow
            </p>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl">
              Scan. Fix. Ship.
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            One workflow that turns accessibility audits into shipped code.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <ProcessCard
            step="01"
            title="Scan"
            body="Enter a URL and we check contrast, keyboard paths, semantics, focus states, and screen reader support."
            icon={<ScanSearch className="size-5" aria-hidden />}
            gradient="mint"
            radius="organic-a"
          />
          <ProcessCard
            step="02"
            title="Fix"
            body="Get prioritized issues, implementation guidance, and code-level fix suggestions."
            icon={<Wrench className="size-5" aria-hidden />}
            gradient="peach"
            radius="organic-b"
          />
          <ProcessCard
            step="03"
            title="Ship"
            body="Package the fixes into clear tasks your team can implement, review, and release."
            icon={<Rocket className="size-5" aria-hidden />}
            gradient="lime-bold"
            radius="organic-a"
          />
        </div>
      </section>

      {/* Optimus */}
      <section id="optimus" className="mt-12">
        <div className="grid gap-5 lg:grid-cols-12">
          <BentoCard
            radius="lg"
            gradient="sage"
            className="p-8 sm:p-10 lg:col-span-7"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-foreground/70 backdrop-blur">
              <Brain className="size-3" aria-hidden /> Optimus document agent
            </span>
            <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">
              Meet Optimus, your document accessibility agent.
            </h2>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">
              Optimus lives on your computer and helps employees understand
              complex company documents faster. Built for teams that want to
              reduce cognitive load and make workplace information easier to
              access — supporting autistic and neurodivergent employees as they
              navigate dense internal knowledge.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/optimus"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
              >
                Explore Optimus <ArrowRight className="size-4" />
              </Link>
              <span className="text-xs text-muted-foreground">
                Supports EU accessibility readiness.
              </span>
            </div>
          </BentoCard>

          <BentoCard
            radius="organic-b"
            gradient="lavender"
            className="p-6 lg:col-span-5"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-foreground/60">
              Optimus, live
            </p>
            <div className="mt-4 space-y-3">
              <ChatBubble
                role="user"
                text="What does section 4.2 of this policy mean for me?"
              />
              <ChatBubble
                role="optimus"
                text="In plain language: you can request a quiet workspace and flexible hours. Here are the 3 steps to ask for it."
              />
            </div>
          </BentoCard>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <FeatureCard
            icon={<FileText className="size-4" />}
            title="Document summaries"
            body="Turn dense PDFs and policies into clear, structured summaries."
            gradient="mint"
          />
          <FeatureCard
            icon={<MessagesSquare className="size-4" />}
            title="Context-aware answers"
            body="Ask what a document means and get plain-language explanations."
            gradient="peach"
          />
          <FeatureCard
            icon={<Brain className="size-4" />}
            title="Cognitive load support"
            body="Break complex requirements into manageable steps."
            gradient="lemon"
          />
          <FeatureCard
            icon={<Users className="size-4" />}
            title="Workplace accessibility"
            body="Help teams make internal knowledge easier to access for everyone."
            gradient="sky"
          />
          <FeatureCard
            icon={<Building2 className="size-4" />}
            title="EU compliance support"
            body="Organize accessibility evidence, requirements, and notes."
            gradient="blush"
          />
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mt-12">
        <BentoCard radius="lg" gradient="lime-bold" className="p-8 sm:p-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-foreground/70">
                Ready when you are
              </p>
              <h2 className="mt-2 max-w-xl font-display text-3xl leading-tight sm:text-5xl">
                Find accessibility issues, fix the code, and ship compliant
                experiences.
              </h2>
            </div>
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background"
            >
              Start scanning <ArrowRight className="size-4" />
            </Link>
          </div>
        </BentoCard>
      </section>
    </main>
  );
}

function ProcessCard({
  step,
  title,
  body,
  icon,
  gradient,
  radius,
}: {
  step: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  gradient: "mint" | "peach" | "lime-bold";
  radius: "organic-a" | "organic-b";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <BentoCard radius={radius} gradient={gradient} className="h-full p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-foreground/60">
            {step}
          </span>
          <span className="grid size-9 place-items-center rounded-2xl bg-card text-foreground shadow-bento-sm">
            {icon}
          </span>
        </div>
        <h3 className="mt-4 font-display text-3xl">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </BentoCard>
    </motion.div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  gradient: "mint" | "peach" | "lemon" | "sky" | "blush";
}) {
  return (
    <BentoCard radius="sm" gradient={gradient} className="p-5">
      <span className="grid size-8 place-items-center rounded-xl bg-card shadow-bento-sm">
        {icon}
      </span>
      <p className="mt-3 font-display text-xl leading-tight">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </BentoCard>
  );
}

function ChatBubble({
  role,
  text,
}: {
  role: "user" | "optimus";
  text: string;
}) {
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl rounded-br-sm bg-foreground px-4 py-2.5 text-sm text-background"
            : "max-w-[90%] rounded-2xl rounded-bl-sm bg-card px-4 py-2.5 text-sm text-foreground shadow-bento-sm"
        }
      >
        {text}
      </div>
    </div>
  );
}
