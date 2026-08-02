import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/admin/shell";
import { Badge, Button, Panel, PanelHead, StatCard, inputCx } from "@/components/admin/kit";
import { getChatThread, getChatThreads, replyToChat } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/admin/chat")({
  component: AdminChatPage,
  head: () => ({
    meta: [
      { title: "Live Chat | Gigafactory 3X Administration" },
      {
        name: "description",
        content: "Answer secure in-portal client chats: pick a thread, read the transcript and reply or resolve.",
      },
      { property: "og:title", content: "Live Chat | Gigafactory 3X Administration" },
      { property: "og:description", content: "Secure client chat console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AdminChatPage() {
  const loadThreads = useServerFn(getChatThreads);
  const loadThread = useServerFn(getChatThread);
  const reply = useServerFn(replyToChat);
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const threads = useQuery({
    queryKey: ["admin-chat-threads"],
    queryFn: () => loadThreads({} as never),
    refetchInterval: 20000,
  });
  const list = threads.data?.threads ?? [];
  const selected = active ?? list[0]?.id ?? null;

  const transcript = useQuery({
    queryKey: ["admin-chat-thread", selected],
    queryFn: () => loadThread({ data: { threadId: selected! } }),
    enabled: Boolean(selected),
    refetchInterval: 20000,
  });

  const send = useMutation({
    mutationFn: (close: boolean) => reply({ data: { threadId: selected!, body, close } }),
    onSuccess: (r) => {
      setNotice(r.message);
      setBody("");
      void qc.invalidateQueries({ queryKey: ["admin-chat-thread", selected] });
      void qc.invalidateQueries({ queryKey: ["admin-chat-threads"] });
    },
    onError: (e: Error) => setNotice(e.message),
  });

  return (
    <AdminShell
      eyebrow="Operations"
      title="Live chat"
      sub="Secure client conversations inside the portal. Marketing-site visitors reach the third-party widget; signed-in clients reach this desk."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Threads" value={list.length} />
        <StatCard label="Open" value={list.filter((t) => t.status !== "closed").length} tone="electric" />
        <StatCard
          label="Awaiting reply"
          value={list.filter((t) => (t.unread_for_admin ?? 0) > 0).length}
          tone="gold"
        />
        <StatCard label="Resolved" value={list.filter((t) => t.status === "closed").length} tone="success" />
      </div>

      {notice && <p className="text-xs text-[var(--gold)]">{notice}</p>}

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel>
          <PanelHead title="Conversations" sub="Newest activity first" />
          <ul className="divide-y divide-white/6">
            {list.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActive(t.id)}
                  className={
                    "flex w-full items-center gap-2 px-4 py-3 text-left sm:px-5 " +
                    (t.id === selected ? "bg-white/5" : "hover:bg-white/5")
                  }
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{String(t.customer ?? "Customer")}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {new Date(t.last_message_at).toLocaleString()}
                    </span>
                  </span>
                  {(t.unread_for_admin ?? 0) > 0 && <Badge tone="gold">{t.unread_for_admin}</Badge>}
                </button>
              </li>
            ))}
            {list.length === 0 && (
              <li className="px-4 py-6 text-sm text-muted-foreground sm:px-5">No chats yet.</li>
            )}
          </ul>
        </Panel>

        <Panel>
          <PanelHead title="Transcript" sub={selected ? "Replies are delivered instantly in-portal" : "Select a conversation"} />
          <div className="max-h-[420px] space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
            {(transcript.data?.messages ?? []).map((m) => {
              const staff = m.author_role === "admin";
              return (
                <div key={m.id} className={staff ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm " +
                      (staff
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
            {selected && (transcript.data?.messages ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No messages in this thread yet.</p>
            )}
          </div>
          {selected && (
            <div className="flex flex-wrap items-center gap-2 border-t border-white/6 px-4 py-3 sm:px-5">
              <input
                className={inputCx + " min-w-[200px] flex-1"}
                value={body}
                maxLength={2000}
                aria-label="Reply"
                placeholder="Write a reply…"
                onChange={(e) => setBody(e.target.value)}
              />
              <Button onClick={() => send.mutate(false)} disabled={!body.trim() || send.isPending}>
                {send.isPending ? "Sending…" : "Send"}
              </Button>
              <Button variant="ghost" onClick={() => send.mutate(true)} disabled={!body.trim() || send.isPending}>
                Send &amp; resolve
              </Button>
            </div>
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}
