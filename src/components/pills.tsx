import { cn } from "@/lib/utils";
import type { Severity } from "@/data/issues";

const sevStyles: Record<Severity, string> = {
  Critical:
    "bg-[color:var(--sev-critical-bg)] text-[color:var(--sev-critical-fg)]",
  High: "bg-[color:var(--sev-high-bg)] text-[color:var(--sev-high-fg)]",
  Medium: "bg-[color:var(--sev-medium-bg)] text-[color:var(--sev-medium-fg)]",
  Low: "bg-[color:var(--sev-low-bg)] text-[color:var(--sev-low-fg)]",
};

const base =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-tight";

export function SeverityPill({ severity }: { severity: Severity }) {
  return (
    <span className={cn(base, sevStyles[severity])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {severity}
    </span>
  );
}

export function WcagPill({ wcag }: { wcag: string }) {
  return (
    <span className={cn(base, "bg-foreground/5 text-foreground/70")}>
      {wcag}
    </span>
  );
}

export function ImpactPill({ impact }: { impact: string }) {
  return (
    <span className={cn(base, "bg-accent/70 text-accent-foreground")}>
      {impact}
    </span>
  );
}

export function NeutralPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(base, "bg-foreground/5 text-foreground/70", className)}
    >
      {children}
    </span>
  );
}
