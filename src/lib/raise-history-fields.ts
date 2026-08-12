/**
 * Field-level filtering of status history events.
 *
 * Each event carries a before/after diff (see raise-history-diff). This module
 * lets the timeline narrow to the transitions where specific fields changed —
 * e.g. only amount changes — so CSV/PDF exports contain just those rows.
 */

import type { RaiseHistoryEvent } from "./raise-history";

/** Normalised comparison key for a field label. */
export function raiseFieldKey(field: string): string {
  return field.trim().toLowerCase();
}

/** Distinct changed-field labels present in the history, alphabetically sorted. */
export function raiseHistoryFields(events: RaiseHistoryEvent[]): string[] {
  const seen = new Map<string, string>();
  for (const event of events) {
    for (const change of event.changes ?? []) {
      const key = raiseFieldKey(change.field);
      if (key && !seen.has(key)) seen.set(key, change.field.trim());
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

/** How many events changed each field, keyed by the normalised field key. */
export function raiseHistoryFieldCounts(events: RaiseHistoryEvent[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const event of events) {
    const keys = new Set((event.changes ?? []).map((c) => raiseFieldKey(c.field)));
    for (const key of keys) counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/**
 * Events where at least one of the selected fields changed. An empty selection
 * means "no field filter" and returns every event unchanged.
 */
export function filterRaiseHistoryByFields(
  events: RaiseHistoryEvent[],
  fields: string[],
): RaiseHistoryEvent[] {
  if (!fields || fields.length === 0) return events;
  const wanted = new Set(fields.map(raiseFieldKey).filter(Boolean));
  if (wanted.size === 0) return events;
  return events.filter((event) =>
    (event.changes ?? []).some((change) => wanted.has(raiseFieldKey(change.field))),
  );
}

/** True when a field filter is applied. */
export function hasRaiseFieldFilter(fields: string[] | null | undefined): boolean {
  return Boolean(fields && fields.length > 0);
}

/** Human label of the active field filter, for export headers. */
export function raiseHistoryFieldLabel(fields: string[] | null | undefined): string {
  if (!hasRaiseFieldFilter(fields)) return "All changed fields";
  return [...fields!].sort((a, b) => a.localeCompare(b)).join(", ");
}

/** Compact slug of the active field filter, appended to export file names. */
export function raiseHistoryFieldSlug(fields: string[] | null | undefined): string | null {
  if (!hasRaiseFieldFilter(fields)) return null;
  const slug = [...fields!]
    .sort((a, b) => a.localeCompare(b))
    .map((field) =>
      field
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter(Boolean)
    .join("-");
  return slug ? `fields-${slug}` : null;
}
