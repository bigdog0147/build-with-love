/**
 * Deep links for individual capital raising status-history events.
 *
 * A shareable link carries the round id and the event key as search params and
 * an anchor hash so the browser can jump straight to the highlighted row:
 *
 *   https://www.gf3x.space/capital-raising?round=<id>&event=<key>#raise-event-<id>-<key>
 */

import type { RaiseHistoryEvent } from "./raise-history";

export const CAPITAL_RAISING_PATH = "/capital-raising";

/** Stable DOM id for one timeline row, safe for use in a URL hash. */
export function raiseEventElementId(roundId: string, eventKey: string) {
  const slug = (value: string) => value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return `raise-event-${slug(roundId)}-${slug(eventKey)}`;
}

export function raiseEventSearch(roundId: string, eventKey: string) {
  return { round: roundId, event: eventKey } as const;
}

/** Absolute (or relative when no origin is given) shareable URL for one event. */
export function buildRaiseEventLink({
  origin,
  roundId,
  eventKey,
}: {
  origin?: string | null;
  roundId: string;
  eventKey: string;
}) {
  const query = new URLSearchParams({ round: roundId, event: eventKey }).toString();
  const path = `${CAPITAL_RAISING_PATH}?${query}#${raiseEventElementId(roundId, eventKey)}`;
  if (!origin) return path;
  return `${origin.replace(/\/+$/, "")}${path}`;
}

/** Reads a deep-link target out of already-validated search params. */
export function parseRaiseEventTarget(search: {
  round?: string | null;
  event?: string | null;
}): { roundId: string; eventKey: string } | null {
  const roundId = (search.round ?? "").trim();
  const eventKey = (search.event ?? "").trim();
  if (!roundId || !eventKey) return null;
  return { roundId, eventKey };
}

export function isRaiseEventTargeted(
  target: { roundId: string; eventKey: string } | null,
  roundId: string,
  eventKey: string,
) {
  return !!target && target.roundId === roundId && target.eventKey === eventKey;
}

/** True when the deep-linked event exists in this round's history. */
export function raiseEventExists(events: RaiseHistoryEvent[], eventKey: string) {
  return events.some((event) => event.key === eventKey);
}
