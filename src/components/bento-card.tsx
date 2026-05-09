import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

type Gradient =
  | "mint"
  | "peach"
  | "lavender"
  | "lemon"
  | "sky"
  | "blush"
  | "sage"
  | "lime-bold"
  | "none";

type Radius = "default" | "lg" | "sm" | "organic-a" | "organic-b";

type Props = HTMLAttributes<HTMLDivElement> & {
  gradient?: Gradient;
  radius?: Radius;
  bordered?: boolean;
  elevated?: boolean;
};

const radiusMap: Record<Radius, string> = {
  default: "rounded-bento",
  lg: "rounded-bento-lg",
  sm: "rounded-bento-sm",
  "organic-a": "rounded-organic-a",
  "organic-b": "rounded-organic-b",
};

const gradMap: Record<Gradient, string> = {
  mint: "grad-mint",
  peach: "grad-peach",
  lavender: "grad-lavender",
  lemon: "grad-lemon",
  sky: "grad-sky",
  blush: "grad-blush",
  sage: "grad-sage",
  "lime-bold": "grad-lime-bold",
  none: "",
};

export const BentoCard = forwardRef<HTMLDivElement, Props>(
  (
    {
      className,
      gradient = "none",
      radius = "default",
      bordered = true,
      elevated = true,
      children,
      ...rest
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden bg-card text-card-foreground",
          radiusMap[radius],
          bordered && "border border-border/60",
          elevated && "shadow-bento-sm",
          className,
        )}
        {...rest}
      >
        {gradient !== "none" && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 opacity-90",
              gradMap[gradient],
            )}
          />
        )}
        <div className="relative">{children}</div>
      </div>
    );
  },
);
BentoCard.displayName = "BentoCard";
