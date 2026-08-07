/**
 * Pure grouping of status-history events into investor-facing categories so the
 * timeline can be filtered with chips (round, interest, desk decision, funding,
 * outcome).
 */

import type { RaiseHistoryEvent } from "./raise-history";

export type RaiseHistoryCategory = "round" | "interest" | "decision" | "funding" | "outcome";

export const RAISE_HISTORY_CATEGORIES: {
  key: RaiseHistoryCategory;
  label: string;
}[] = [
  { key: "round", label: "Round" },
  { key: "interest", label: "Interest" },
  { key: "decision", label: "Desk decision" },
  { key: "funding", label: "Funding" },
  { key: "outcome", label: "Acceptance / release" },
];

/** Category for one history event, derived from its stable event key. */
export function raiseHistoryCategory(event: RaiseHistoryEvent): RaiseHistoryCategory {
  const key = event.key;
  if (key.startsWith("round-")) return "round";
  if (key === "interest-invited" || key === "interest-declined") return "decision";
  if (key.startsWith("interest-")) return "interest";
  if (key === "commitment-accepted" || key === "commitment-released") return "outcome";
  return "funding";
}

/** Count of events per category, for chip badges. */
export function raiseHistoryCounts(
  events: RaiseHistoryEvent[],
): Record<RaiseHistoryCategory, number> {
  const counts: Record<RaiseHistoryCategory, number> = {
    round: 0,
    interest: 0,
    decision: 0,
    funding: 0,
    outcome: 0,
  };
  for (const event of events) counts[raiseHistoryCategory(event)] += 1;
  return counts;
}

/** Events matching the active categories. An empty selection means "show all". */
export function filterRaiseHistory(
  events: RaiseHistoryEvent[],
  active: RaiseHistoryCategory[],
): RaiseHistoryEvent[] {
  if (active.length === 0) return events;
  const set = new Set(active);
  return events.filter((event) => set.has(raiseHistoryCategory(event)));
}

/** Human label of the active type filters, for export headers. */
export function raiseHistoryFilterLabel(active: RaiseHistoryCategory[]): string {
  if (!active || active.length === 0) return "All event types";
  const order = RAISE_HISTORY_CATEGORIES.filter((c) => active.includes(c.key)).map((c) => c.label);
  return order.join(", ");
}

/** Compact slug of the active type filters, appended to export file names. */
export function raiseHistoryFilterSlug(active: RaiseHistoryCategory[]): string | null {
  if (!active || active.length === 0) return null;
  const keys = RAISE_HISTORY_CATEGORIES.filter((c) => active.includes(c.key)).map((c) => c.key);
  if (keys.length === 0) return null;
  return keys.join("-");
}
