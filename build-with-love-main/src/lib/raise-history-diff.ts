/**
 * Before/after change diffs for capital raising status history events.
 *
 * Each event can carry a small list of field-level changes (status, amount,
 * desk note) so CSV and PDF exports state exactly what moved at every stage
 * instead of only naming the resulting stage.
 */

export interface RaiseHistoryChange {
  /** Human label of the field that changed, e.g. "Status". */
  field: string;
  /** Value before the transition; null when the field had no prior value. */
  from: string | null;
  /** Value after the transition; null when the field was cleared. */
  to: string | null;
}

export const NO_VALUE = "—";

/** Renders a single value, falling back to a dash when absent or blank. */
export function formatChangeValue(value: string | null | undefined): string {
  if (value === null || value === undefined) return NO_VALUE;
  const text = String(value).trim();
  return text.length ? text : NO_VALUE;
}

/** "Status: pending → invited" for one change. */
export function formatChange(change: RaiseHistoryChange): string {
  return `${change.field}: ${formatChangeValue(change.from)} → ${formatChangeValue(change.to)}`;
}

/** Single-line summary of every change on an event, or "" when there are none. */
export function formatChangeSummary(changes: RaiseHistoryChange[] | null | undefined): string {
  if (!changes || changes.length === 0) return "";
  return changes.map(formatChange).join("; ");
}

/** Convenience builder that drops no-op changes (identical before/after). */
export function change(
  field: string,
  from: string | null | undefined,
  to: string | null | undefined,
): RaiseHistoryChange | null {
  const before = from === undefined ? null : from;
  const after = to === undefined ? null : to;
  if (formatChangeValue(before) === formatChangeValue(after)) return null;
  return { field, from: before, to: after };
}

/** Filters out nulls from a list of optional changes. */
export function changes(
  ...list: Array<RaiseHistoryChange | null | undefined>
): RaiseHistoryChange[] {
  return list.filter((item): item is RaiseHistoryChange => Boolean(item));
}
