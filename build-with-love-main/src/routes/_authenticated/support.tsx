import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { DashShell, PageHeading } from "@/components/dashboard-chrome";
import { createSupportTicket, listSupportTickets } from "@/lib/customer.functions";
import { LiveChat } from "@/components/live-chat";

export const Route = createFileRoute("/_authenticated/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Support — Gigafactory 3X" },
      { name: "description", content: "Raise and track support tickets with the GF3X client desk." },
    ],
  }),
});

const CATEGORIES = ["general", "transfers", "cards", "investments", "verification", "security"];

function SupportPage() {
  const queryClient = useQueryClient();
  const fetchTickets = useServerFn(listSupportTickets);
  const submitTicket = useServerFn(createSupportTicket);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const tickets = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => fetchTickets({} as never),
  });

  const mutation = useMutation({
    mutationFn: () => submitTicket({ data: { subject, category, message } }),
    onSuccess: () => {
      setSubject("");
      setMessage("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (err: unknown) =>
      setError(err instanceof Error ? err.message : "Could not create ticket"),
  });

  return (
    <DashShell>
      <PageHeading
        eyebrow="Client desk"
        title="Support tickets"
        sub="Chat live with the client desk, or raise a ticket and track responses from your relationship team."
      />

      <LiveChat />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="glass space-y-3 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 text-sm">
            <LifeBuoy className="h-4 w-4 text-[var(--gold)]" /> New ticket
          </div>
          <input
            required
            maxLength={160}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm capitalize outline-none focus:border-[var(--gold)]/60"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
          <textarea
            required
            maxLength={4000}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your request…"
            className="w-full rounded-xl border border-border bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold)]/60"
          />
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]"
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-xl py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            style={{ background: "var(--gradient-gold)" }}
          >
            {mutation.isPending ? "Submitting…" : "Submit ticket"}
          </button>
        </form>

        <div className="glass rounded-2xl p-2">
          {tickets.isLoading && <p className="p-6 text-sm text-muted-foreground">Loading tickets…</p>}
          {!tickets.isLoading && (tickets.data?.length ?? 0) === 0 && (
            <p className="p-6 text-sm text-muted-foreground">No tickets yet.</p>
          )}
          <ul className="divide-y divide-border/60">
            {(tickets.data ?? []).map((t) => (
              <li key={t.id} className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm">{t.subject}</span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t.status}
                  </span>
                </div>
                <div className="mt-1 text-xs capitalize text-muted-foreground">
                  {t.category} · {new Date(t.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashShell>
  );
}
