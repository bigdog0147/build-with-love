import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MessagesSquare } from "lucide-react";
import { getMyChat, sendChatMessage } from "@/lib/chat.functions";

/** Secure in-portal live chat with the GF3X client desk. */
export function LiveChat() {
  const load = useServerFn(getMyChat);
  const send = useServerFn(sendChatMessage);
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const chat = useQuery({
    queryKey: ["my-chat"],
    queryFn: () => load({} as never),
    refetchInterval: 15000,
  });

  const messages = chat.data?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const mutation = useMutation({
    mutationFn: () => send({ data: { threadId: chat.data!.thread.id, body } }),
    onSuccess: () => {
      setBody("");
      setError(null);
      void qc.invalidateQueries({ queryKey: ["my-chat"] });
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Message not sent"),
  });

  return (
    <section className="rounded-2xl border border-border p-5 glass" aria-label="Live chat">
      <header className="flex items-center gap-2">
        <MessagesSquare className="h-4 w-4 text-[var(--gold)]" />
        <h2 className="font-display text-lg">Live chat</h2>
        <span className="ml-auto text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {chat.data?.thread.status === "closed" ? "Resolved" : "Client desk online"}
        </span>
      </header>

      <div
        className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Start the conversation — a relationship manager replies during desk hours.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.author_role === "customer";
          return (
            <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm " +
                  (mine
                    ? "border border-[var(--gold)]/30 bg-[var(--gold)]/10"
                    : "border border-border bg-[var(--surface)]")
                }
              >
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  {m.author_name} · {new Date(m.created_at).toLocaleTimeString()}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (chat.data) mutation.mutate();
        }}
      >
        <label className="sr-only" htmlFor="chat-body">
          Message
        </label>
        <input
          id="chat-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder="Type a message…"
          className="w-full rounded-lg border border-border bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]/60"
        />
        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-sm text-black disabled:opacity-50"
          style={{ background: "var(--gradient-gold)" }}
          disabled={!body.trim() || mutation.isPending || !chat.data}
        >
          {mutation.isPending ? "Sending…" : "Send"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
    </section>
  );
}
