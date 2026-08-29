"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Loader2, MessageSquare, Monitor, Send, Smartphone, Tablet, X } from "lucide-react";
import {
  buildMessageMetadata,
  deviceLabel,
  type ChatDevice,
  type ChatMessageMetadata,
} from "@/lib/chat-visitor";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "What projects have you built?",
  "What's your tech stack?",
  "Are you available for work?",
] as const;

type PortfolioUIMessage = UIMessage<ChatMessageMetadata>;

function messageText(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text as string)
    .join("");
}

function DeviceIcon({ device, className }: { device: ChatDevice; className?: string }) {
  switch (device) {
    case "mobile":
      return <Smartphone className={className} aria-hidden />;
    case "tablet":
      return <Tablet className={className} aria-hidden />;
    default:
      return <Monitor className={className} aria-hidden />;
  }
}

function UserMessageMeta({ metadata }: { metadata: ChatMessageMetadata }) {
  return (
    <p className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px] leading-none text-muted">
      <DeviceIcon device={metadata.device} className="h-3 w-3 shrink-0" />
      <span>{deviceLabel(metadata.device)}</span>
    </p>
  );
}

export function PortfolioChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const panelId = useId();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const pendingMetadataRef = useRef<ChatMessageMetadata | null>(null);
  const [metadataByMessageId, setMetadataByMessageId] = useState<
    Record<string, ChatMessageMetadata>
  >({});

  const { messages, sendMessage, status, error, stop } = useChat<PortfolioUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const pending = pendingMetadataRef.current;
    if (!pending) return;

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;

    setMetadataByMessageId((prev) => {
      if (prev[lastUser.id]) return prev;
      return { ...prev, [lastUser.id]: pending };
    });
    pendingMetadataRef.current = null;
  }, [messages]);

  const close = useCallback(() => {
    setOpen(false);
    if (busy) stop();
    requestAnimationFrame(() => fabRef.current?.focus());
  }, [busy, stop]);

  const openPanel = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const panel = panelRef.current;
    const focusables = panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener("keydown", onKeyDown);
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [open, messages, busy]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const metadata = buildMessageMetadata();
    pendingMetadataRef.current = metadata;

    await sendMessage({ text: trimmed, metadata });
    setInput("");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit(input);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
      <div className="pointer-events-auto relative flex flex-col items-end gap-3">
        {open && (
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "flex w-[min(100vw-2rem,24rem)] flex-col overflow-hidden border border-border bg-[var(--glass-solid)] shadow-lg backdrop-blur-md",
              "radius-panel-lg",
              "h-[min(32.5rem,calc(100dvh-7rem))]",
              "origin-bottom-right transition-[opacity,transform] duration-200 ease-out",
              "motion-reduce:transition-none",
            )}
          >
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="truncate text-sm font-medium tracking-tight text-foreground"
                >
                  Ask about me
                </h2>
                <p className="truncate text-xs text-muted">
                  Projects, skills, and how to get in touch
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="radius-control inline-flex h-9 w-9 cursor-pointer items-center justify-center border border-border bg-subtle text-foreground transition-colors duration-200 hover:bg-[var(--fill-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/30"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>

            <div
              ref={listRef}
              data-lenis-prevent
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
              aria-live="polite"
            >
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted">
                    Ask about projects, skills, or how to reach me.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        disabled={busy}
                        onClick={() => void submit(suggestion)}
                        className="radius-chip cursor-pointer border border-border bg-subtle px-2.5 py-1.5 text-left text-xs text-foreground transition-colors duration-200 hover:bg-[var(--fill-hover)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/30"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => {
                const text = messageText(message.parts);
                const isUser = message.role === "user";
                const metadata = isUser
                  ? (message.metadata ?? metadataByMessageId[message.id])
                  : undefined;

                return (
                  <div
                    key={message.id}
                    className={cn("flex", isUser ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%]",
                        isUser ? "text-right" : "text-left",
                      )}
                    >
                      <div
                        className={cn(
                          "radius-panel px-3 py-2 text-sm leading-relaxed",
                          isUser
                            ? "inline-block text-left bg-[var(--cta-bg)] text-[var(--cta-fg)]"
                            : "border border-border bg-subtle text-foreground",
                        )}
                      >
                        {text || (busy && !isUser ? "…" : null)}
                      </div>
                      {metadata && <UserMessageMeta metadata={metadata} />}
                    </div>
                  </div>
                );
              })}

              {status === "submitted" && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Thinking…
                </div>
              )}

              {error && (
                <p role="alert" className="text-sm text-red-400">
                  Something went wrong. Please try again or use the contact
                  form.
                </p>
              )}
            </div>

            <form onSubmit={onSubmit} className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <label htmlFor={`${panelId}-input`} className="sr-only">
                  Message
                </label>
                <input
                  ref={inputRef}
                  id={`${panelId}-input`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={busy}
                  placeholder="Ask a question…"
                  autoComplete="off"
                  className="radius-control h-10 min-w-0 flex-1 border border-border bg-[var(--form-surface)] px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted focus-visible:ring-1 focus-visible:ring-[var(--fill-hover)] disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="radius-control inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-[color:var(--cta-border)] bg-[var(--cta-bg)] text-[var(--cta-fg)] transition-[filter,box-shadow,opacity] duration-200 ease-out hover:brightness-110 hover:shadow-[0_8px_24px_-8px_var(--overlay)] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:hover:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/30 motion-reduce:transition-none"
                  aria-label="Send message"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <button
          ref={fabRef}
          type="button"
          onClick={() => (open ? close() : openPanel())}
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={open ? "Close chat" : "Open chat — ask about me"}
          className={cn(
            "radius-control inline-flex h-12 w-12 cursor-pointer items-center justify-center border border-[color:var(--cta-border)] bg-[var(--cta-bg)] text-[var(--cta-fg)] shadow-md transition-[filter,box-shadow,opacity] duration-200 ease-out hover:brightness-110 hover:shadow-[0_10px_28px_-8px_var(--overlay)] active:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/30",
            "motion-reduce:transition-none",
          )}
        >
          {open ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <MessageSquare className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
