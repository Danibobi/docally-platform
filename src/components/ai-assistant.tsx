import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BentoCard } from "./bento-card";
import { scanSummary } from "@/data/issues";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;

const SUGGESTIONS = [
  "Explain my accessibility score",
  "What should I fix first?",
  "How do I fix contrast issues?",
  "Show me a focus ring example",
];

export type AIAssistantProps = {
  initialContext?: Record<string, unknown>;
  initialPrompt?: string;
  variant?: "sidebar" | "drawer";
  onClose?: () => void;
  className?: string;
};

export function AIAssistant({
  initialContext,
  initialPrompt,
  variant = "sidebar",
  onClose,
  className,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState(initialPrompt ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const ctx = initialContext ?? { scan: scanSummary };
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next, context: ctx }),
      });

      if (!resp.ok || !resp.body) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${resp.status})`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (c) upsert(c);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BentoCard
      gradient="sage"
      radius="lg"
      className={cn(
        "flex flex-col",
        variant === "sidebar" ? "h-[calc(100vh-7rem)]" : "h-full",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <span className="text-lg leading-none" aria-hidden>
              🧑‍⚕️
            </span>
          </span>
          <div>
            <p className="font-display text-lg leading-tight">Audit assistant</p>
            <p className="text-xs text-muted-foreground">Always here, ready to help</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close assistant"
            className="rounded-full p-2 text-muted-foreground hover:bg-foreground/5"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask me anything about your scan, or pick a suggestion.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm bg-card/80 text-foreground border border-border/60",
              )}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-pre:my-2 prose-pre:bg-foreground/5 prose-pre:text-foreground prose-code:text-foreground prose-headings:text-foreground prose-strong:text-foreground">
                  <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border/60 bg-card/80 px-4 py-3">
              <Dot delay={0} />
              <Dot delay={150} />
              <Dot delay={300} />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t border-border/60 p-3"
      >
        <div className="flex items-end gap-2 rounded-3xl border border-border/60 bg-card/90 px-3 py-2 focus-within:border-foreground/30">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask about your scan…"
            rows={1}
            className="flex-1 resize-none bg-transparent py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none"
            aria-label="Message"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </BentoCard>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-foreground/40"
      style={{ animationDelay: `${delay}ms` }}
      aria-hidden
    />
  );
}
