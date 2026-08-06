import { useEffect, useMemo, useRef, useState } from "react";
import { History, ChevronDown, Download, FileText, Link2, Table2 } from "lucide-react";
import { toast } from "sonner";
import type { RaiseHistoryEvent, RaiseHistoryTone } from "@/lib/raise-history";
import {
  buildRaiseConfirmation,
  downloadRaiseConfirmation,
  raiseConfirmationTitle,
} from "@/lib/raise-confirmation";
import {
  buildRaiseHistoryCsv,
  buildRaiseHistoryReportHtml,
  downloadTextFile,
  printRaiseHistoryReport,
  raiseHistoryCsvFileName,
} from "@/lib/raise-history-export";
import {
  RAISE_HISTORY_CATEGORIES,
  filterRaiseHistory,
  raiseHistoryCounts,
  type RaiseHistoryCategory,
} from "@/lib/raise-history-filters";
import {
  buildRaiseEventLink,
  isRaiseEventTargeted,
  raiseEventElementId,
  raiseEventExists,
} from "@/lib/raise-history-links";



const TONE: Record<RaiseHistoryTone, string> = {
  neutral: "hsl(var(--border))",
  progress: "var(--gold)",
  success: "var(--success)",
  warning: "var(--warning, var(--gold))",
};

function stamp(at: string | null) {
  if (!at) return "Date not recorded";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "Date not recorded";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actorBadge(actor: RaiseHistoryEvent["actor"]) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {actor}
    </span>
  );
}

function noteBlock(note: string | null | undefined, downloadable?: boolean) {
  if (note) {
    return (
      <div className="mt-2 border-l-2 border-[var(--gold)]/60 bg-[var(--gold)]/[0.04] pl-3 pr-2 py-1.5">
        <span className="block text-[10px] uppercase tracking-wider text-[var(--gold)]">Desk note</span>
        <p className="text-sm text-foreground/90">{note}</p>
      </div>
    );
  }
  if (downloadable) {
    return (
      <p className="mt-2 text-xs italic text-muted-foreground/70">No desk note recorded.</p>
    );
  }
  return null;
}

async function copyLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Event link copied to clipboard.");
  } catch {
    toast.error("Could not copy the link. Copy it from the address bar instead.");
  }
}

export function RaiseHistoryTimeline({
  events,
  roundId,
  roundName,
  currency = "USD",
  investorName = "Investor",
  target = null,
}: {
  events: RaiseHistoryEvent[];
  roundId?: string;
  roundName?: string;
  currency?: string;
  investorName?: string;
  /** Deep-link target parsed from the URL search params. */
  target?: { roundId: string; eventKey: string } | null;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<RaiseHistoryCategory[]>([]);
  const focusedRef = useRef<HTMLLIElement | null>(null);

  const counts = useMemo(() => raiseHistoryCounts(events), [events]);
  const visible = useMemo(() => filterRaiseHistory(events, active), [events, active]);

  const deepLinked =
    roundId && target && target.roundId === roundId && raiseEventExists(events, target.eventKey)
      ? target.eventKey
      : null;

  // A shared link must land on its event: expand the panel and drop filters
  // that would hide the row, then scroll it into view.
  useEffect(() => {
    if (!deepLinked) return;
    setOpen(true);
    setActive([]);
  }, [deepLinked]);

  useEffect(() => {
    if (!deepLinked || !open) return;
    const node = focusedRef.current;
    if (!node) return;
    const id = window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [deepLinked, open, visible.length]);

  if (events.length === 0) return null;

  const exportInput = {
    events: visible,
    roundName: roundName ?? "Capital raise",
    currency,
    investorName,
  };

  const toggle = (key: RaiseHistoryCategory) =>
    setActive((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));


  return (
    <div className="rounded-xl border border-border/70 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 font-display text-lg">
          <History className="h-4 w-4 text-[var(--gold)]" aria-hidden />
          Status history
          <span className="text-xs font-sans uppercase tracking-widest text-muted-foreground">
            {active.length > 0 ? `${visible.length} of ${events.length}` : events.length}{" "}
            {events.length === 1 ? "event" : "events"}
          </span>

        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            downloadTextFile(
              raiseHistoryCsvFileName({ roundName: exportInput.roundName }),
              buildRaiseHistoryCsv(exportInput),
              "text/csv",
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--gold)]/50 hover:text-foreground"
        >
          <Table2 className="h-3.5 w-3.5" aria-hidden />
          Download history CSV
        </button>
        <button
          type="button"
          onClick={() => printRaiseHistoryReport(buildRaiseHistoryReportHtml(exportInput))}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--gold)]/50 hover:text-foreground"
        >
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Download history PDF
        </button>
      </div>

      <div
        className="mt-3 flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter status history by type"
      >
        <button
          type="button"
          onClick={() => setActive([])}
          aria-pressed={active.length === 0}
          className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-widest transition-colors ${
            active.length === 0
              ? "border-[var(--gold)]/60 bg-[var(--gold)]/12 text-[var(--gold)]"
              : "border-border text-muted-foreground hover:border-[var(--gold)]/40 hover:text-foreground"
          }`}
        >
          All
        </button>
        {RAISE_HISTORY_CATEGORIES.map((category) => {
          const count = counts[category.key];
          const on = active.includes(category.key);
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => toggle(category.key)}
              disabled={count === 0}
              aria-pressed={on}
              className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                on
                  ? "border-[var(--gold)]/60 bg-[var(--gold)]/12 text-[var(--gold)]"
                  : "border-border text-muted-foreground hover:border-[var(--gold)]/40 hover:text-foreground"
              }`}
            >
              {category.label}
              <span className="ml-1.5 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {events.length > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-[var(--gold)]/20 bg-[var(--gold)]/5 px-3 py-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" aria-hidden />
          <div className="flex flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span className="text-sm font-medium">Latest: {events[events.length - 1]!.label}</span>
            <time
              className="text-xs text-muted-foreground"
              dateTime={events[events.length - 1]!.at ?? undefined}
            >
              Reached {stamp(events[events.length - 1]!.at)}
            </time>
          </div>
        </div>
      )}

      {open && visible.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          No events match the selected types. Clear the filters to see the full history.
        </p>
      )}

      {open && visible.length > 0 && (
        <ol
          className="mt-4 space-y-0"
          aria-label={roundName ? `Status history for ${roundName}` : "Status history"}
        >
          {visible.map((event, i) => {
            const last = i === visible.length - 1;

            const color = TONE[event.tone];
            const focused = isRaiseEventTargeted(target, roundId ?? "", event.key);
            return (
              <li
                key={event.key}
                id={roundId ? raiseEventElementId(roundId, event.key) : undefined}
                ref={focused ? focusedRef : undefined}
                aria-current={focused ? "true" : undefined}
                className={`grid scroll-mt-24 grid-cols-[auto_1fr] gap-x-3 ${
                  focused ? "rounded-lg bg-[var(--gold)]/[0.07] ring-1 ring-[var(--gold)]/40 px-2 -mx-2" : ""
                }`}
              >
                <div className="flex flex-col items-center">
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: color }}
                    aria-hidden
                  />
                  {!last && (
                    <span
                      className="w-px flex-1"
                      style={{ background: "hsl(var(--border))" }}
                      aria-hidden
                    />
                  )}
                </div>
                <div className={last ? "pb-0" : "pb-5"}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">{event.label}</span>
                    {actorBadge(event.actor)}
                  </div>
                  <time
                    className="mt-1 block text-xs text-muted-foreground"
                    dateTime={event.at ?? undefined}
                  >
                    {stamp(event.at)}
                  </time>
                  <p className="mt-2 text-sm text-muted-foreground">{event.detail}</p>
                  {noteBlock(event.note, event.downloadable)}
                  {event.downloadable && (
                    <button
                      type="button"
                      onClick={() =>
                        downloadRaiseConfirmation(
                          buildRaiseConfirmation({
                            kind: event.key,
                            reference: event.reference ?? event.key,
                            roundName: roundName ?? "Capital raise",
                            currency,
                            investorName,
                            amount: event.amount ?? null,
                            decidedAt: event.at,
                            actor: event.actor,
                            headline: event.label,
                            detail: event.detail,
                            note: event.note ?? null,
                          }),
                        )
                      }
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--gold)]/50 hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      Download {raiseConfirmationTitle(event.key).toLowerCase()}
                    </button>
                  )}
                  {roundId && (
                    <button
                      type="button"
                      onClick={() =>
                        copyLink(
                          buildRaiseEventLink({
                            origin: typeof window === "undefined" ? null : window.location.origin,
                            roundId,
                            eventKey: event.key,
                          }),
                        )
                      }
                      className="mt-2 ml-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--gold)]/50 hover:text-foreground"
                      aria-label={`Copy shareable link to ${event.label}`}
                    >
                      <Link2 className="h-3.5 w-3.5" aria-hidden />
                      Copy link
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
