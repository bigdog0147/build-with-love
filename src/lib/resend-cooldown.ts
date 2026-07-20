export const RESEND_COOLDOWN_SECONDS = 60;
export const RESEND_STORAGE_KEY = "gf3.reset.resend.last";

// Pure helper — how many seconds remain before the next resend is allowed.
// `lastMs` is the timestamp of the last successful send (0 if none),
// `nowMs` is the current time, `cooldownSec` is the window in seconds.
export function computeCooldown(
  lastMs: number,
  nowMs: number,
  cooldownSec: number = RESEND_COOLDOWN_SECONDS,
): number {
  if (!lastMs || lastMs <= 0) return 0;
  const elapsed = Math.floor((nowMs - lastMs) / 1000);
  return Math.max(0, cooldownSec - elapsed);
}
