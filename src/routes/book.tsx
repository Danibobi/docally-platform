import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, addDays, isSameDay, isWeekend } from "date-fns";
import { motion } from "framer-motion";
import { Calendar as CalIcon, Check, Clock } from "lucide-react";
import { BentoCard } from "@/components/bento-card";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a call — BridgeDoc" },
      {
        name: "description",
        content:
          "Pick a time and we'll walk through your scan results and accessibility package.",
      },
      { property: "og:title", content: "Book a call — BridgeDoc" },
      {
        property: "og:description",
        content:
          "A 30-minute working session to plan your accessibility package.",
      },
    ],
  }),
  component: BookPage,
});

const SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

function BookPage() {
  const today = useMemo(() => new Date(), []);
  const [date, setDate] = useState<Date | undefined>(addDays(today, 1));
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{
    date: Date;
    slot: string;
  } | null>(null);

  const submit = () => {
    if (!date || !slot) {
      toast.error("Pick a date and a time slot first");
      return;
    }
    setConfirmed({ date, slot });
    toast.success("Call reserved");
  };

  if (confirmed) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <BentoCard radius="lg" gradient="mint" className="p-8 sm:p-12">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <Check className="size-6" />
          </motion.div>
          <h1 className="mt-5 text-center font-display text-4xl sm:text-5xl">
            Call reserved
          </h1>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
            We'll use this session to review your accessibility score, code
            fixes, and shipping plan.
          </p>
          <div className="mx-auto mt-6 w-fit rounded-2xl border border-border/60 bg-card px-5 py-4 text-center">
            <p className="text-xs uppercase tracking-wider text-foreground/60">
              Your call
            </p>
            <p className="mt-1 font-display text-2xl">
              {format(confirmed.date, "EEEE, MMM d")} • {confirmed.slot}
            </p>
          </div>
          <div className="mt-7 flex justify-center">
            <button
              onClick={() => {
                setConfirmed(null);
                setSlot(null);
              }}
              className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium"
            >
              Book another time
            </button>
          </div>
        </BentoCard>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 pb-20 pt-6 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-foreground/60">
          Book a call
        </p>
        <h1 className="mt-1 font-display text-4xl sm:text-5xl">
          Book a call
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Pick a time and we'll walk through your scan results and accessibility
          package.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <BentoCard radius="lg" gradient="lemon" className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-foreground/60">
            <CalIcon className="size-3.5" /> Pick a date
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setSlot(null);
            }}
            disabled={(d) => d < today || isWeekend(d)}
            initialFocus
            className={cn("mt-3 p-0 pointer-events-auto")}
          />
        </BentoCard>

        <BentoCard radius="lg" gradient="sky" className="p-6 lg:col-span-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-foreground/60">
            <Clock className="size-3.5" /> Available times
          </div>
          <p className="mt-1 font-display text-2xl">
            {date ? format(date, "EEEE, MMM d") : "Pick a date first"}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {SLOTS.map((s) => {
              const active = slot === s;
              const disabled =
                date && isSameDay(date, today) && parseTime(s) <= today;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={disabled || !date}
                  onClick={() => setSlot(s)}
                  className={cn(
                    "rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "border-foreground bg-primary text-primary-foreground shadow-bento-sm"
                      : "border-border/60 bg-card hover:border-foreground/30",
                    disabled && "cursor-not-allowed opacity-30",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-border/60 bg-card/80 p-4">
            <p className="text-xs uppercase tracking-wider text-foreground/60">
              Selected
            </p>
            <p className="mt-1 font-display text-xl">
              {date ? format(date, "EEEE, MMM d") : "—"}
              {slot ? ` • ${slot}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!date || !slot}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity disabled:opacity-40"
          >
            Confirm call
          </button>
        </BentoCard>
      </div>
    </main>
  );
}

function parseTime(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}
