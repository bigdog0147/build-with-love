import { useEffect, useMemo, useRef, useState } from "react";
import {
  History,
  CalendarRange,
  ChevronDown,
  Download,
  FileArchive,
  FileDiff,
  Columns2,
  Columns3,
  GitCompareArrows,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Link2,
  SlidersHorizontal,
  Table2,
  X,
} from "lucide-react";
import {
  loadRaiseFieldPresets,
  presetFieldsMatch,
  presetSummary,
  removeRaiseFieldPreset,
  saveRaiseFieldPresets,
  upsertRaiseFieldPreset,
  type RaiseFieldPreset,
} from "@/lib/raise-field-presets";
import {
  RAISE_TRANSITION_STATEMENT_TITLE,
  downloadRaiseTransitionStatement,
} from "@/lib/raise-history-statement";
import {
  filterRaiseHistoryByFields,
  hasRaiseFieldFilter,
  raiseFieldKey,
  raiseHistoryFieldCounts,
  raiseHistoryFieldLabel,
  raiseHistoryFieldSlug,
  raiseHistoryFields,
} from "@/lib/raise-history-fields";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import type { RaiseHistoryEvent, RaiseHistoryTone } from "@/lib/raise-history";
import {
  downloadRaiseConfirmation,
  raiseConfirmationTitle,
} from "@/lib/raise-confirmation";
import {
  downloadBulkRaiseConfirmations,
  downloadableRaiseEvents,
} from "@/lib/raise-confirmations-bulk";

import {
  buildRaiseHistoryCsv,
  buildRaiseHistoryReportHtml,
  downloadTextFile,
  printRaiseHistoryReport,
  raiseHistoryCsvFileName,
} from "@/lib/raise-history-export";
import { RaiseHistoryExportPreviewDialog } from "@/components/raise-history-export-preview";
import {
  RAISE_HISTORY_CATEGORIES,
  filterRaiseHistory,
  raiseHistoryFilterLabel,
  raiseHistoryFilterSlug,
  raiseHistoryCounts,
  type RaiseHistoryCategory,
} from "@/lib/raise-history-filters";
import {
  EMPTY_RAISE_HISTORY_RANGE,
  filterRaiseHistoryByRange,
  hasRaiseHistoryRange,
  raiseHistoryRangeLabel,
  raiseHistoryRangeSlug,
  type RaiseHistoryRange,
} from "@/lib/raise-history-range";
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
  onDownload,
}: {
  events: RaiseHistoryEvent[];
  roundId?: string;
  roundName?: string;
  currency?: string;
  investorName?: string;
  /** Deep-link target parsed from the URL search params. */
  target?: { roundId: string; eventKey: string } | null;
  /** Called after a confirmation download so it can be written to the audit trail. */
  onDownload?: (entry: {
    roundId: string | null;
    roundName: string;
    eventKey: string;
    documentTitle: string;
    reference: string | null;
    source: "portal" | "bulk";
    documentCount: number;
  }) => void;
}) {

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<RaiseHistoryCategory[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [diffOnly, setDiffOnly] = useState(false);
  const [includeDiff, setIncludeDiff] = useState(true);


  const [range, setRange] = useState<RaiseHistoryRange>(EMPTY_RAISE_HISTORY_RANGE);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [presets, setPresets] = useState<RaiseFieldPreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const focusedRef = useRef<HTMLLIElement | null>(null);

  // Presets live in localStorage, so they load after hydration.
  useEffect(() => {
    setPresets(loadRaiseFieldPresets());
  }, []);


  const counts = useMemo(() => raiseHistoryCounts(events), [events]);
  const fieldOptions = useMemo(() => raiseHistoryFields(events), [events]);
  const fieldCounts = useMemo(() => raiseHistoryFieldCounts(events), [events]);
  const visible = useMemo(
    () =>
      filterRaiseHistoryByFields(
        filterRaiseHistoryByRange(filterRaiseHistory(events, active), range),
        fields,
      ),
    [events, active, range, fields],
  );
  const rangeActive = hasRaiseHistoryRange(range);
  const rangeLabel = raiseHistoryRangeLabel(range);
  const fieldsActive = hasRaiseFieldFilter(fields);

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
    setFields([]);
    setRange(EMPTY_RAISE_HISTORY_RANGE);
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
    rangeLabel,
    rangeSlug: raiseHistoryRangeSlug(range),
    filterLabel: raiseHistoryFilterLabel(active),
    filterSlug: raiseHistoryFilterSlug(active),
    fieldLabel: raiseHistoryFieldLabel(fields),
    fieldSlug: raiseHistoryFieldSlug(fields),
    diffOnly,
    includeDiff,

  };


  const toggleField = (field: string) =>
    setFields((prev) => (prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]));


  const confirmationCount = downloadableRaiseEvents(events).length;

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
            {active.length > 0 || rangeActive
              ? `${visible.length} of ${events.length}`
              : events.length}{" "}
            {events.length === 1 ? "event" : "events"}
          </span>

        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Select the export date range. Current range: ${rangeLabel}`}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                rangeActive
                  ? "border-[var(--gold)]/60 bg-[var(--gold)]/10 text-[var(--gold)]"
                  : "border-border text-muted-foreground hover:border-[var(--gold)]/50 hover:text-foreground"
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" aria-hidden />
              {rangeLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="range"
              numberOfMonths={2}
              defaultMonth={range.from ?? undefined}
              selected={
                range.from || range.to
                  ? ({ from: range.from ?? undefined, to: range.to ?? undefined } as DateRange)
                  : undefined
              }
              onSelect={(picked: DateRange | undefined) =>
                setRange({ from: picked?.from ?? null, to: picked?.to ?? null })
              }
              className="pointer-events-auto p-3"
            />
            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
              <span className="text-xs text-muted-foreground">
                Exports include {visible.length} of {events.length}{" "}
                {events.length === 1 ? "event" : "events"}
              </span>
              <button
                type="button"
                onClick={() => setRange(EMPTY_RAISE_HISTORY_RANGE)}
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Clear
              </button>
            </div>
          </PopoverContent>
        </Popover>
        {rangeActive && (
          <button
            type="button"
            onClick={() => setRange(EMPTY_RAISE_HISTORY_RANGE)}
            aria-label="Clear the export date range"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--gold)]/50 hover:text-foreground"
          >
            <X className="h-3 w-3" aria-hidden />
            Clear dates
          </button>
        )}
        <button
          type="button"
          onClick={() => setDiffOnly((v) => !v)}
          aria-pressed={diffOnly}
          aria-label="Export only the changed fields of each status transition"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
            diffOnly
              ? "border-[var(--gold)]/60 bg-[var(--gold)]/10 text-[var(--gold)]"
              : "border-border text-muted-foreground hover:border-[var(--gold)]/50 hover:text-foreground"
          }`}
        >
          <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
          Diff-only export
        </button>
        <button
          type="button"
          onClick={() => setIncludeDiff((v) => !v)}
          disabled={diffOnly}
          aria-pressed={includeDiff}
          aria-label={
            diffOnly
              ? "Before and after columns are always included in a diff-only export"
              : includeDiff
                ? "Exclude the before and after diff columns and visuals from exports"
                : "Include the before and after diff columns and visuals in exports"
          }
          title={
            diffOnly ? "Diff-only exports always show before and after values" : undefined
          }
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            includeDiff && !diffOnly
              ? "border-[var(--gold)]/60 bg-[var(--gold)]/10 text-[var(--gold)]"
              : "border-border text-muted-foreground hover:border-[var(--gold)]/50 hover:text-foreground"
          }`}
        >
          {includeDiff ? (
            <Columns3 className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Columns2 className="h-3.5 w-3.5" aria-hidden />
          )}
          {includeDiff ? "Diff columns on" : "Diff columns off"}
        </button>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          aria-haspopup="dialog"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--gold)]/50 hover:text-foreground"
        >
          <Table2 className="h-3.5 w-3.5" aria-hidden />
          Preview &amp; export history
        </button>
        <RaiseHistoryExportPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          input={exportInput}
          onConfirmCsv={() => {
            downloadTextFile(
              raiseHistoryCsvFileName({
                roundName: exportInput.roundName,
                rangeSlug: exportInput.rangeSlug,
                filterSlug: exportInput.filterSlug,
                fieldSlug: exportInput.fieldSlug,
                diffOnly: exportInput.diffOnly,
                includeDiff: exportInput.includeDiff,
              }),


              buildRaiseHistoryCsv(exportInput),
              "text/csv",
            );
            setPreviewOpen(false);
          }}
          onConfirmPdf={() => {
            printRaiseHistoryReport(buildRaiseHistoryReportHtml(exportInput));
            setPreviewOpen(false);
          }}
        />
        {confirmationCount > 0 && (
          <button
            type="button"
            onClick={() => {
              const count = downloadBulkRaiseConfirmations({
                events,
                roundName: exportInput.roundName,
                currency,
                investorName,
              });
              if (count > 0) {
                toast.success(
                  `Bundled ${count} confirmation ${count === 1 ? "document" : "documents"} into a ZIP archive.`,
                );
                onDownload?.({
                  roundId: roundId ?? null,
                  roundName: exportInput.roundName,
                  eventKey: "bulk",
                  documentTitle: "All confirmation documents",
                  reference: null,
                  source: "bulk",
                  documentCount: count,
                });
              } else {
                toast.error("No confirmation documents are available for this round yet.");
              }
            }}

            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2.5 py-1 text-xs text-[var(--gold)] transition-colors hover:border-[var(--gold)]/70"
            aria-label={`Download all ${confirmationCount} confirmation documents for this round as a ZIP archive`}
          >
            <FileArchive className="h-3.5 w-3.5" aria-hidden />
            Download all confirmations ({confirmationCount})
          </button>
        )}
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

      {fieldOptions.length > 0 && (
        <div
          className="mt-3 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Export only transitions where these fields changed"
        >
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            Changed fields
          </span>
          <button
            type="button"
            onClick={() => setFields([])}
            aria-pressed={!fieldsActive}
            className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-widest transition-colors ${
              !fieldsActive
                ? "border-[var(--gold)]/60 bg-[var(--gold)]/12 text-[var(--gold)]"
                : "border-border text-muted-foreground hover:border-[var(--gold)]/40 hover:text-foreground"
            }`}
          >
            Any
          </button>
          {fieldOptions.map((field) => {
            const count = fieldCounts[raiseFieldKey(field)] ?? 0;
            const on = fields.includes(field);
            return (
              <button
                key={field}
                type="button"
                onClick={() => toggleField(field)}
                aria-pressed={on}
                aria-label={`Export only transitions where ${field} changed (${count})`}
                className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-widest transition-colors ${
                  on
                    ? "border-[var(--gold)]/60 bg-[var(--gold)]/12 text-[var(--gold)]"
                    : "border-border text-muted-foreground hover:border-[var(--gold)]/40 hover:text-foreground"
                }`}
              >
                {field}
                <span className="ml-1.5 opacity-70">{count}</span>
              </button>
            );
          })}
          {fieldsActive && (
            <span className="text-xs text-muted-foreground">
              Exports include {visible.length} of {events.length}{" "}
              {events.length === 1 ? "event" : "events"}
            </span>
          )}
        </div>
      )}

      {fieldOptions.length > 0 && (
        <div className="mt-3 rounded-lg border border-border/70 bg-muted/10 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
              <Bookmark className="h-3.5 w-3.5" aria-hidden />
              Saved field filters
            </span>
            {presets.length === 0 && (
              <span className="text-xs text-muted-foreground">
                Pick changed fields above, then save the combination to reuse it later.
              </span>
            )}
            {presets.map((preset) => {
              const on = presetFieldsMatch(preset.fields, fields);
              return (
                <span
                  key={preset.id}
                  className={`inline-flex items-center gap-1 rounded-full border pl-2.5 pr-1 py-0.5 text-[11px] transition-colors ${
                    on
                      ? "border-[var(--gold)]/60 bg-[var(--gold)]/12 text-[var(--gold)]"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setFields(preset.fields)}
                    aria-pressed={on}
                    title={presetSummary(preset)}
                    className="uppercase tracking-widest hover:text-foreground"
                  >
                    {preset.name}
                    <span className="ml-1.5 opacity-70">{preset.fields.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = removeRaiseFieldPreset(presets, preset.id);
                      setPresets(next);
                      saveRaiseFieldPresets(next);
                      toast.success(`Removed the “${preset.name}” filter preset.`);
                    }}
                    aria-label={`Delete the ${preset.name} field filter preset`}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="raise-field-preset-name">
              Preset name
            </label>
            <input
              id="raise-field-preset-name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              maxLength={48}
              placeholder={fieldsActive ? "Name this field selection" : "Select fields first"}
              disabled={!fieldsActive}
              className="w-52 rounded-lg border border-border bg-background px-2.5 py-1 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[var(--gold)]/60 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={!fieldsActive || presetName.trim().length === 0}
              onClick={() => {
                const { presets: next, preset, replaced } = upsertRaiseFieldPreset(presets, {
                  name: presetName,
                  fields,
                });
                setPresets(next);
                saveRaiseFieldPresets(next);
                setPresetName("");
                toast.success(
                  replaced
                    ? `Updated the “${preset.name}” filter preset.`
                    : `Saved “${preset.name}” with ${preset.fields.length} ${
                        preset.fields.length === 1 ? "field" : "fields"
                      }.`,
                );
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-2.5 py-1 text-xs text-[var(--gold)] transition-colors hover:border-[var(--gold)]/70 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BookmarkPlus className="h-3.5 w-3.5" aria-hidden />
              Save current fields
            </button>
            <span className="text-xs text-muted-foreground">
              Presets stay on this device and reapply the changed-field filter used by exports.
            </span>
          </div>
        </div>
      )}




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
          No events match the selected {rangeActive ? "date range" : "types"}. Clear the filters to
          see the full history.
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
                      onClick={() => {
                        downloadRaiseConfirmation({
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
                        });
                        onDownload?.({
                          roundId: roundId ?? null,
                          roundName: roundName ?? "Capital raise",
                          eventKey: event.key,
                          documentTitle: raiseConfirmationTitle(event.key),
                          reference: event.reference ?? event.key,
                          source: "portal",
                          documentCount: 1,
                        });
                      }}

                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--gold)]/50 hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      Download {raiseConfirmationTitle(event.key).toLowerCase()}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const fileName = downloadRaiseTransitionStatement({
                        event,
                        roundName: roundName ?? "Capital raise",
                        currency,
                        investorName,
                      });
                      if (!fileName) return;
                      toast.success("Change statement downloaded.");
                      onDownload?.({
                        roundId: roundId ?? null,
                        roundName: roundName ?? "Capital raise",
                        eventKey: event.key,
                        documentTitle: `${RAISE_TRANSITION_STATEMENT_TITLE} — ${event.label}`,
                        reference: event.reference ?? null,
                        source: "portal",
                        documentCount: 1,
                      });
                    }}
                    className="mt-2 ml-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--gold)]/50 hover:text-foreground"
                    aria-label={`Download the change statement PDF for ${event.label}`}
                  >
                    <FileDiff className="h-3.5 w-3.5" aria-hidden />
                    Diff statement (PDF)
                  </button>
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
