import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  MailWarning,
  RefreshCw,
  Search,
  ChevronRight,
  Download,
} from "lucide-react";
import {
  EMAIL_EVENT_TYPES,
  listAdminEmailLogs,
  type EmailLogRow,
} from "@/lib/email-logs.functions";
import { EmailLogDetail } from "@/components/admin/email-log-detail";
import { downloadEmailLogsCsv, emailLogsCsvFilename } from "@/lib/email-logs-csv";

export const Route = createFileRoute("/_authenticated/admin/email-logs")({
  component: EmailLogsPage,
  head: () => ({
    meta: [
      { title: "Email Delivery Logs — Gigafactory 3X Admin" },
      {
        name: "description",
        content:
          "Verify OTP, password-reset and notification email delivery and troubleshoot rejected, bounced or suppressed sends.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const EVENT_LABEL: Record<string, string> = {
  sent: "Sent",
  rejected: "Rejected",
  bounced: "Bounced",
  complained: "Complaint",
  unsubscribed: "Unsubscribed",
  suppressed: "Suppressed",
  rate_limited: "Rate limited",
};

const RANGES = [
  { label: "24 hours", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
];

function tone(eventType: string) {
  if (eventType === "sent") return "text-emerald-400 border-emerald-400/40 bg-emerald-400/10";
  if (eventType === "rejected" || eventType === "bounced")
    return "text-red-400 border-red-400/40 bg-red-400/10";
  return "text-amber-400 border-amber-400/40 bg-amber-400/10";
}

function fmt(ts: string) {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleString();
}

function EmailLogsPage() {
  const fetchLogs = useServerFn(listAdminEmailLogs);
  const [recipientInput, setRecipientInput] = useState("");
  const [recipient, setRecipient] = useState("");
  const [eventType, setEventType] = useState<string>("");
  const [days, setDays] = useState(7);
  const [selected, setSelected] = useState<EmailLogRow | null>(null);

  const logs = useQuery({
    queryKey: ["admin-email-logs", recipient, eventType, days],
    queryFn: () => fetchLogs({ data: { recipient, eventType, days } }),
    retry: false,
  });

  const rows: EmailLogRow[] = logs.data?.rows ?? [];
  const failures = rows.filter((r) => r.eventType !== "sent").length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-[var(--gold)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to admin dashboard
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Inbox className="h-5 w-5 text-[var(--gold)]" /> Email delivery logs
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Delivery events for one-time codes, password resets and notification emails.
            Confirm a send reached the provider, or diagnose rejections, bounces,
            suppressions and rate limits.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={rows.length === 0}
          onClick={() =>
            downloadEmailLogsCsv(
              rows,
              emailLogsCsvFilename({ recipient, eventType, days }),
            )
          }
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--gold)]/50 px-3 py-2 text-xs text-[var(--gold)] transition hover:bg-[var(--gold)]/10 disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV{rows.length ? ` (${rows.length})` : ""}
        </button>
        <button
          type="button"
          onClick={() => logs.refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
        >
          {logs.isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </button>
        </div>
      </header>

      <section className="mt-6 grid gap-3 rounded-xl border border-border p-4 md:grid-cols-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setRecipient(recipientInput.trim());
          }}
        >
          <label className="sr-only" htmlFor="recipient">
            Filter by recipient
          </label>
          <div className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 focus-within:border-[var(--gold)]">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              id="recipient"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full bg-transparent text-xs text-foreground outline-none"
            />
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEventType("")}
            aria-pressed={eventType === ""}
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition ${
              eventType === ""
                ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                : "border-border text-muted-foreground hover:border-[var(--gold)]/60"
            }`}
          >
            All events
          </button>
          {EMAIL_EVENT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEventType(t)}
              aria-pressed={eventType === t}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] transition ${
                eventType === t
                  ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                  : "border-border text-muted-foreground hover:border-[var(--gold)]/60"
              }`}
            >
              {EVENT_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-start gap-2 md:justify-end">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              aria-pressed={days === r.days}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] transition ${
                days === r.days
                  ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                  : "border-border text-muted-foreground hover:border-[var(--gold)]/60"
              }`}
            >
              <Clock className="h-3 w-3" /> {r.label}
            </button>
          ))}
        </div>
      </section>

      {logs.data?.unavailable ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-xs text-amber-300">
          <MailWarning className="mt-0.5 h-4 w-4 shrink-0" />
          {logs.data.unavailable}
        </p>
      ) : null}
      {logs.isError ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-xs text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {(logs.error as Error).message}
        </p>
      ) : null}

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Events in range" value={String(rows.length)} />
        <Stat label="Successful sends" value={String(rows.length - failures)} />
        <Stat label="Problems" value={String(failures)} />
      </section>

      <section className="mt-4 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Detail</th>
                <th className="px-4 py-3 font-medium">Message ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.isPending ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No delivery events recorded for this filter.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={`${r.timestamp}-${i}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`View delivery details for ${r.recipient}`}
                    onClick={() => setSelected(r)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(r);
                      }
                    }}
                    className="cursor-pointer border-b border-border/60 outline-none transition last:border-0 hover:bg-[var(--gold)]/5 focus-visible:bg-[var(--gold)]/5"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {fmt(r.timestamp)}
                    </td>
                    <td className="px-4 py-3">{r.recipient}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${tone(
                          r.eventType,
                        )}`}
                      >
                        {r.eventType === "sent" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {EVENT_LABEL[r.eventType] ?? r.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.status ?? (r.tags.length ? r.tags.join(", ") : "—")}
                    </td>
                    <td className="max-w-[220px] px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate">{r.messageId ?? "—"}</span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--gold)]/70" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-3 text-[11px] text-muted-foreground">
        {logs.data?.historyStartsAt
          ? `History available from ${fmt(logs.data.historyStartsAt)}. `
          : ""}
        {logs.data?.hasMore ? "Showing the 100 most recent events — narrow the filters to see older ones. " : ""}
        Delivered and opened outcomes are not tracked by the email platform, so a
        “Sent” event means the provider accepted the message for delivery.
      </p>

      <EmailLogDetail row={selected} onClose={() => setSelected(null)} />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
