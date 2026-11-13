/**
 * Pure resolution of per-round Capital raising alert preferences.
 *
 * Global preferences (`raise_email` / `raise_inapp`) set the baseline. A per-round
 * override may only narrow that baseline: muting a round always wins, but opting a
 * round in cannot resurrect a channel the investor switched off globally.
 */

export type RaiseChannel = "email" | "inapp";

export type RaiseRoundOverride = {
  round_id: string;
  email_enabled: boolean;
  inapp_enabled: boolean;
};

export type RaiseGlobalPrefs = {
  raise_email?: boolean;
  raise_inapp?: boolean;
};

export type ResolvedRaisePrefs = {
  email: boolean;
  inapp: boolean;
  /** True when a stored override exists for this round. */
  overridden: boolean;
};

function globalAllows(prefs: RaiseGlobalPrefs | null | undefined, channel: RaiseChannel) {
  const value = channel === "email" ? prefs?.raise_email : prefs?.raise_inapp;
  return value === undefined || value === null ? true : Boolean(value);
}

export function resolveRaisePrefs(
  prefs: RaiseGlobalPrefs | null | undefined,
  override: Pick<RaiseRoundOverride, "email_enabled" | "inapp_enabled"> | null | undefined,
): ResolvedRaisePrefs {
  const email = globalAllows(prefs, "email") && (override ? Boolean(override.email_enabled) : true);
  const inapp = globalAllows(prefs, "inapp") && (override ? Boolean(override.inapp_enabled) : true);
  return { email, inapp, overridden: Boolean(override) };
}

/** Indexes override rows by round id for O(1) lookups in list views. */
export function indexOverrides(rows: RaiseRoundOverride[] | null | undefined) {
  const map: Record<string, RaiseRoundOverride> = {};
  for (const row of rows ?? []) if (row?.round_id) map[row.round_id] = row;
  return map;
}

/** Short label describing the current subscription state of a round. */
export function raisePrefSummary(resolved: ResolvedRaisePrefs) {
  if (!resolved.email && !resolved.inapp) return "All alerts muted";
  if (resolved.email && resolved.inapp) return "Email + in-app alerts on";
  return resolved.email ? "Email alerts only" : "In-app alerts only";
}
