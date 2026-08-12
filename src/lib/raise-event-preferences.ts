/**
 * Pure mapping from a raise timeline advance event to the per-event email
 * preference that gates it.
 *
 * The Capital raising category preference (`raise_email`) remains the ceiling:
 * a per-event switch can only silence an email, never resurrect one the
 * investor turned off for the whole category or for that round.
 */

export type RaiseEventPrefKey =
  | "raise_event_interest_email"
  | "raise_event_withdrawn_email"
  | "raise_event_cancelled_email";

export const RAISE_EVENT_PREFS: { key: RaiseEventPrefKey; label: string; sub: string }[] = [
  {
    key: "raise_event_interest_email",
    label: "Interest registered or resubmitted",
    sub: "Receipts confirming a new or updated indication of interest.",
  },
  {
    key: "raise_event_withdrawn_email",
    label: "Interest withdrawn",
    sub: "Confirmation that an indication of interest was withdrawn.",
  },
  {
    key: "raise_event_cancelled_email",
    label: "Commitment cancelled",
    sub: "Confirmation that a commitment was cancelled and no capital is held.",
  },
];

/** Resolves the preference key for a raise event id, or null when unmapped. */
export function raiseEventPrefKey(event: string | null | undefined): RaiseEventPrefKey | null {
  const value = (event ?? "").trim().toLowerCase();
  if (!value) return null;
  if (value.startsWith("interest-withdrawn")) return "raise_event_withdrawn_email";
  if (value.startsWith("interest-submitted") || value.startsWith("interest-resubmitted"))
    return "raise_event_interest_email";
  if (value.startsWith("commitment-cancelled")) return "raise_event_cancelled_email";
  return null;
}

/** True when the investor still wants an email for this specific event. */
export function raiseEventEmailAllowed(
  prefs: Record<string, unknown> | null | undefined,
  event: string | null | undefined,
): boolean {
  const key = raiseEventPrefKey(event);
  if (!key) return true;
  const value = prefs?.[key];
  return value === undefined || value === null ? true : Boolean(value);
}
