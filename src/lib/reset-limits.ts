/**
 * Parses RESET_LIMIT_* environment variables into positive integers,
 * falling back to sensible defaults when a value is missing, non-integer,
 * or negative/zero.
 *
 * Each RESET_LIMIT_* value represents a count (attempts) or a window in
 * seconds — both must be positive integers.
 */

export const RESET_LIMIT_DEFAULTS = {
  RESET_LIMIT_MAX_ATTEMPTS: 5,
  RESET_LIMIT_WINDOW_SECONDS: 60 * 15, // 15 minutes
  RESET_LIMIT_COOLDOWN_SECONDS: 60 * 60, // 1 hour
} as const;

export type ResetLimitKey = keyof typeof RESET_LIMIT_DEFAULTS;

/**
 * Parse a single value into a positive integer, or return `fallback`
 * when the input is missing, not a finite integer, or <= 0.
 */
export function parseResetLimitValue(
  raw: string | undefined | null,
  fallback: number,
): number {
  if (raw === undefined || raw === null) return fallback;
  const trimmed = String(raw).trim();
  if (trimmed === "") return fallback;

  // Reject anything that isn't a plain (optionally signed) integer literal.
  // This rules out "1.5", "1e3", "0x10", "12abc", "NaN", "Infinity", etc.
  if (!/^-?\d+$/.test(trimmed)) return fallback;

  const n = Number(trimmed);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return fallback;
  if (n <= 0) return fallback;
  return n;
}

/**
 * Read all RESET_LIMIT_* keys from an env-like record, applying defaults
 * for any missing/invalid entries.
 */
export function parseResetLimits(
  env: Record<string, string | undefined> = {},
): Record<ResetLimitKey, number> {
  const out = {} as Record<ResetLimitKey, number>;
  for (const key of Object.keys(RESET_LIMIT_DEFAULTS) as ResetLimitKey[]) {
    out[key] = parseResetLimitValue(env[key], RESET_LIMIT_DEFAULTS[key]);
  }
  return out;
}
