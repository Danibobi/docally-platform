import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Brain,
  Building2,
  FileText,
  MessagesSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { BentoCard } from "@/components/bento-card";

export const Route = createFileRoute("/optimus")({
  head: () => ({
    meta: [
      { title: "Optimus — Document accessibility agent — BridgeDoc" },
      {
        name: "description",
        content:
          "Optimus helps employees understand complex company documents — supporting autistic and neurodivergent teammates and reducing cognitive load.",
      },
      {
        property: "og:title",
        content: "Optimus — Document accessibility agent",
      },
      {
        property: "og:description",
        content:
          "Plain-language summaries, context-aware answers, and EU-ready accessibility evidence.",
      },
    ],
  }),
  component: OptimusPage,
});

function OptimusPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-20 pt-6 sm:px-6">
      <BentoCard radius="lg" gradient="sage" className="p-8 sm:p-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-foreground/70 backdrop-blur">
          <Brain className="size-3" aria-hidden /> Optimus document agent
        </span>
        <h1 className="mt-5 font-display text-4xl leading-tight sm:text-6xl">
          Make complex documents easier to read for everyone.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Optimus lives on your computer and helps employees understand what is
          inside dense company documents. It supports autistic and
          neurodivergent employees, reduces cognitive load, and helps teams
          build more accessible workplaces — while supporting EU accessibility
          readiness.
        </p>
      </BentoCard>

      <section className="mt-6 grid gap-5 lg:grid-cols-12">
        <BentoCard
          radius="lg"
          gradient="lavender"
          className="p-6 lg:col-span-7"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-foreground/60">
            Optimus, live preview
          </p>
          <div className="mt-4 space-y-3">
            <ChatBubble
              role="user"
              text="Summarize the workplace accessibility policy in plain language."
            />
            <ChatBubble
              role="optimus"
              text="In short: the company commits to accessible workspaces, flexible hours where helpful, and assistive tools on request. Three steps to ask for accommodations are listed in section 4.2."
            />
            <ChatBubble
              role="user"
              text="Which parts apply to remote employees?"
            />
            <ChatBubble
              role="optimus"
              text="Sections 4.2, 5.1, and 7. I'll highlight them in your document and prepare a one-page summary you can keep."
            />
          </div>
        </BentoCard>

        <BentoCard
          radius="organic-b"
          gradient="lemon"
          className="p-6 lg:col-span-5"
        >
          <Sparkles className="size-5" aria-hidden />
          <p className="mt-3 font-display text-3xl leading-tight">
            Built with care for neurodivergent teammates.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Optimus uses respectful, plain language. It focuses on reducing
            cognitive load, surfacing the parts that matter, and never replaces
            people — it supports them.
          </p>
        </BentoCard>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Feature
          icon={<FileText className="size-4" />}
          title="Document summaries"
          body="Turn dense PDFs and policies into clear, structured summaries."
          gradient="mint"
        />
        <Feature
          icon={<MessagesSquare className="size-4" />}
          title="Context-aware answers"
          body="Ask what a document means and get plain-language explanations."
          gradient="peach"
        />
        <Feature
          icon={<Brain className="size-4" />}
          title="Cognitive load support"
          body="Break complex requirements into manageable steps."
          gradient="lavender"
        />
        <Feature
          icon={<Users className="size-4" />}
          title="Workplace accessibility"
          body="Help teams make internal knowledge easier to access for everyone."
          gradient="sky"
        />
        <Feature
          icon={<Building2 className="size-4" />}
          title="EU compliance support"
          body="Organize accessibility evidence, requirements, and implementation notes."
          gradient="blush"
        />
      </section>

      <section className="mt-6">
        <BentoCard radius="lg" gradient="lime-bold" className="p-8 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-foreground/70">
                Bring Optimus to your team
              </p>
              <h2 className="mt-2 max-w-xl font-display text-3xl leading-tight sm:text-4xl">
                Make every document easier to navigate.
              </h2>
            </div>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
            >
              Talk to us <ArrowRight className="size-4" />
            </Link>
          </div>
        </BentoCard>
      </section>
    </main>
  );
}

function ChatBubble({ role, text }: { role: "user" | "optimus"; text: string }) {
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

function Feature({
  icon,
  title,
  body,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  gradient: "mint" | "peach" | "lavender" | "sky" | "blush";
}) {
  return (
    <BentoCard radius="sm" gradient={gradient} className="p-5">
      <span className="grid size-9 place-items-center rounded-2xl bg-card shadow-bento-sm">
        {icon}
      </span>
      <p className="mt-3 font-display text-xl leading-tight">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </BentoCard>
  );
}
