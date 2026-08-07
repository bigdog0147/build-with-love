/**
 * Pure delivery-window maths for notification emails.
 *
 * Customers can hold email alerts inside quiet hours and/or batch Capital
 * raising alerts into a daily or weekly digest. Everything here is timezone
 * aware but side-effect free so it can be unit tested without a database.
 */

export type DigestMode = "instant" | "daily" | "weekly";

export type DeliveryWindow = {
  quiet_hours_enabled?: boolean | null;
  quiet_hours_start?: number | null;
  quiet_hours_end?: number | null;
  time_zone?: string | null;
  /** Digest mode for the Capital raising category. */
  raise_digest?: string | null;
  digest_hour?: number | null;
};

export type ScheduleDecision =
  | { mode: "immediate" }
  | { mode: "deferred"; deliverAfter: Date; reason: "quiet_hours" | "daily_digest" | "weekly_digest" };

const HOUR = 60 * 60 * 1000;

export function normalizeHour(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 23) return fallback;
  return n;
}

export function normalizeDigest(value: unknown): DigestMode {
  return value === "daily" || value === "weekly" ? value : "instant";
}

export function safeTimeZone(zone: unknown): string {
  const tz = typeof zone === "string" && zone.trim() ? zone.trim() : "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

/** Local wall-clock parts of `at` in `zone`. */
export function zonedParts(at: Date, zone: string) {
  const tz = safeTimeZone(zone);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(at)) parts[p.type] = p.value;
  const hour = Number(parts["hour"] === "24" ? "0" : parts["hour"]);
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts["weekday"] ?? "Sun");
  return {
    hour,
    minute: Number(parts["minute"] ?? "0"),
    weekday: weekdayIndex < 0 ? 0 : weekdayIndex,
  };
}

/** True when the local hour falls inside the quiet window (wrapping midnight). */
export function inQuietHours(at: Date, window: DeliveryWindow): boolean {
  if (!window.quiet_hours_enabled) return false;
  const start = normalizeHour(window.quiet_hours_start, 21);
  const end = normalizeHour(window.quiet_hours_end, 7);
  if (start === end) return false;
  const { hour } = zonedParts(at, safeTimeZone(window.time_zone));
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

/** Next instant at which the local clock reads `targetHour:00` after `at`. */
export function nextLocalHour(at: Date, zone: string, targetHour: number): Date {
  const tz = safeTimeZone(zone);
  const { hour, minute } = zonedParts(at, tz);
  let deltaHours = targetHour - hour;
  if (deltaHours <= 0) deltaHours += 24;
  // Land on the top of the hour by removing the elapsed minutes.
  return new Date(at.getTime() + deltaHours * HOUR - minute * 60 * 1000);
}

/** Next Monday at `targetHour` local time (used for the weekly digest). */
export function nextWeeklySlot(at: Date, zone: string, targetHour: number): Date {
  const tz = safeTimeZone(zone);
  let candidate = nextLocalHour(at, tz, targetHour);
  for (let i = 0; i < 8; i += 1) {
    if (zonedParts(candidate, tz).weekday === 1) return candidate;
    candidate = new Date(candidate.getTime() + 24 * HOUR);
  }
  return candidate;
}

/**
 * Decides whether an email may go out now or must wait, given the customer's
 * quiet hours and (for Capital raising) their digest cadence.
 */
export function scheduleDelivery(
  category: string,
  window: DeliveryWindow,
  now: Date = new Date(),
): ScheduleDecision {
  const tz = safeTimeZone(window.time_zone);
  const digestHour = normalizeHour(window.digest_hour, 8);
  const digest = category === "raise" ? normalizeDigest(window.raise_digest) : "instant";

  if (digest === "daily") {
    return { mode: "deferred", deliverAfter: nextLocalHour(now, tz, digestHour), reason: "daily_digest" };
  }
  if (digest === "weekly") {
    return { mode: "deferred", deliverAfter: nextWeeklySlot(now, tz, digestHour), reason: "weekly_digest" };
  }

  if (inQuietHours(now, window)) {
    const end = normalizeHour(window.quiet_hours_end, 7);
    return { mode: "deferred", deliverAfter: nextLocalHour(now, tz, end), reason: "quiet_hours" };
  }

  return { mode: "immediate" };
}

/** Short human label for a schedule decision, used in UI copy and logs. */
export function describeSchedule(decision: ScheduleDecision): string {
  if (decision.mode === "immediate") return "Sent immediately";
  const when = decision.deliverAfter.toISOString();
  if (decision.reason === "quiet_hours") return `Held for quiet hours until ${when}`;
  if (decision.reason === "daily_digest") return `Batched into the daily digest at ${when}`;
  return `Batched into the weekly digest at ${when}`;
}
