/**
 * Pure date-range filtering for the status history timeline and its exports.
 *
 * The range is inclusive and day-based: picking a single day keeps every event
 * that happened on that calendar day. Events without a recorded timestamp are
 * kept only when no range is selected, since they cannot be placed in time.
 */

import type { RaiseHistoryEvent } from "./raise-history";

export type RaiseHistoryRange = {
  from: Date | null;
  to: Date | null;
};

export const EMPTY_RAISE_HISTORY_RANGE: RaiseHistoryRange = { from: null, to: null };

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function valid(d: Date | null | undefined): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

/** True when the range restricts anything at all. */
export function hasRaiseHistoryRange(range: RaiseHistoryRange | null | undefined): boolean {
  if (!range) return false;
  return valid(range.from) || valid(range.to);
}

/**
 * Normalises a picked range: invalid dates are dropped and a reversed
 * selection (to before from) is swapped so the bounds always make sense.
 */
export function normalizeRaiseHistoryRange(
  range: RaiseHistoryRange | null | undefined,
): RaiseHistoryRange {
  if (!range) return EMPTY_RAISE_HISTORY_RANGE;
  let from = valid(range.from) ? startOfDay(range.from) : null;
  let to = valid(range.to) ? endOfDay(range.to) : null;
  if (from && to && from.getTime() > to.getTime()) {
    const swapped = startOfDay(to);
    to = endOfDay(from);
    from = swapped;
  }
  return { from, to };
}

/** Whether one event's timestamp falls inside the range. */
export function isRaiseEventInRange(
  event: RaiseHistoryEvent,
  range: RaiseHistoryRange | null | undefined,
): boolean {
  const bounds = normalizeRaiseHistoryRange(range);
  if (!bounds.from && !bounds.to) return true;
  if (!event.at) return false;
  const at = new Date(event.at);
  if (Number.isNaN(at.getTime())) return false;
  if (bounds.from && at.getTime() < bounds.from.getTime()) return false;
  if (bounds.to && at.getTime() > bounds.to.getTime()) return false;
  return true;
}

/** Events whose timestamps fall inside the range. No range means "keep all". */
export function filterRaiseHistoryByRange(
  events: RaiseHistoryEvent[],
  range: RaiseHistoryRange | null | undefined,
): RaiseHistoryEvent[] {
  if (!hasRaiseHistoryRange(range)) return events;
  return events.filter((event) => isRaiseEventInRange(event, range));
}

function dayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Human label for the picker trigger and export headers. */
export function raiseHistoryRangeLabel(range: RaiseHistoryRange | null | undefined): string {
  const bounds = normalizeRaiseHistoryRange(range);
  if (bounds.from && bounds.to) {
    return startOfDay(bounds.from).getTime() === startOfDay(bounds.to).getTime()
      ? dayLabel(bounds.from)
      : `${dayLabel(bounds.from)} – ${dayLabel(bounds.to)}`;
  }
  if (bounds.from) return `From ${dayLabel(bounds.from)}`;
  if (bounds.to) return `Until ${dayLabel(bounds.to)}`;
  return "All dates";
}

/** Compact slug for export file names, e.g. "2026-01-01_2026-03-31". */
export function raiseHistoryRangeSlug(range: RaiseHistoryRange | null | undefined): string | null {
  const bounds = normalizeRaiseHistoryRange(range);
  if (!bounds.from && !bounds.to) return null;
  const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "start");
  return `${iso(bounds.from)}_${bounds.to ? bounds.to.toISOString().slice(0, 10) : "latest"}`;
}
