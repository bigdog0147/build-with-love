/**
 * Persistence for investor chart preferences. Kept pure + storage-agnostic so
 * the range the investor picked survives refreshes and new sessions without
 * risking a hydration mismatch (reads happen after mount).
 */

import { RANGES, type RangeKey } from "@/lib/portfolio-series";

export const PORTFOLIO_RANGE_STORAGE_KEY = "gf3x.portfolio.range";
export const DEFAULT_PORTFOLIO_RANGE: RangeKey = "6M";

/** Narrow an untrusted stored value to a supported range key. */
export function parseRange(raw: unknown, fallback: RangeKey = DEFAULT_PORTFOLIO_RANGE): RangeKey {
  return RANGES.some((r) => r.key === raw) ? (raw as RangeKey) : fallback;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function storage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Read the persisted range, falling back to the default when absent/invalid. */
export function readStoredRange(store: StorageLike | null = storage()): RangeKey {
  try {
    return parseRange(store?.getItem(PORTFOLIO_RANGE_STORAGE_KEY));
  } catch {
    return DEFAULT_PORTFOLIO_RANGE;
  }
}

/** Persist the range; silently ignores private-mode / quota failures. */
export function writeStoredRange(range: RangeKey, store: StorageLike | null = storage()): void {
  try {
    store?.setItem(PORTFOLIO_RANGE_STORAGE_KEY, range);
  } catch {
    /* preference persistence is best-effort */
  }
}
