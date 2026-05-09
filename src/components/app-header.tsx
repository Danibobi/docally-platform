import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

const navItems = [
  { to: "/scan", label: "Scan" },
  { to: "/results", label: "Results" },
  { to: "/quiz", label: "Quiz" },
  { to: "/optimus", label: "Optimus" },
  { to: "/book", label: "Book a call" },
] as const;

export function AppHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  const showBookCta =
    path.startsWith("/results") ||
    path.startsWith("/focus") ||
    path.startsWith("/solution") ||
    path.startsWith("/code-fix");

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between rounded-full border border-border/60 bg-card/80 px-4 py-2.5 shadow-bento-sm backdrop-blur-md sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <span className="font-display text-xl leading-none">BridgeDoc</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1 rounded-full bg-foreground/[0.04] p-1">
            {navItems.map((item) => {
              const active =
                path === item.to ||
                path.startsWith(item.to + "/") ||
                (item.to === "/results" && path.startsWith("/focus"));
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-card text-foreground shadow-bento-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link
          to={showBookCta ? "/book" : "/scan"}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {showBookCta ? "Book a call" : "Start scanning"}
        </Link>
      </div>
    </header>
  );
}
