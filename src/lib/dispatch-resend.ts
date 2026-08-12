/**
 * Idempotency rules for admin-triggered resends of audited dispatch jobs.
 *
 * A resend must never reuse the original key (the provider would dedupe it and
 * silently drop the new send), but it must also stay stable per audit row: two
 * clicks on the same log entry produce the same key, so the second attempt is
 * deduped exactly like any other retry of that logical event.
 */
export const RESEND_KEY_PREFIX = "resend";

export function resendIdempotencyKey(
  originalKey: string | null | undefined,
  logId: string,
): string {
  const base = (originalKey ?? "").trim();
  const suffix = `${RESEND_KEY_PREFIX}:${logId}`;
  // Already a resend of a resend: keep one suffix chain, anchored on the newest row.
  if (base.includes(`:${RESEND_KEY_PREFIX}:`)) {
    return `${base.split(`:${RESEND_KEY_PREFIX}:`)[0]}:${suffix}`;
  }
  return base ? `${base}:${suffix}` : suffix;
}

export function isResendKey(key: string | null | undefined): boolean {
  const value = (key ?? "").trim();
  return value === RESEND_KEY_PREFIX || value.includes(`${RESEND_KEY_PREFIX}:`);
}
