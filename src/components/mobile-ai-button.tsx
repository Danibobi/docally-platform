import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AIAssistant, type AIAssistantProps } from "./ai-assistant";

export function MobileAIButton(props: Omit<AIAssistantProps, "variant" | "onClose">) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open AI assistant"
          className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-bento lg:hidden"
        >
          <span className="text-2xl leading-none" aria-hidden>
            🧑‍⚕️
          </span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full max-w-md border-none bg-transparent p-3 sm:max-w-md"
      >
        <AIAssistant {...props} variant="drawer" onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
