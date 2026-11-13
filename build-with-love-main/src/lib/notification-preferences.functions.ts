import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeDigest, normalizeHour, safeTimeZone } from "@/lib/notification-schedule";

export type NotificationPreferences = {
  kyc_email: boolean;
  kyc_inapp: boolean;
  deposits_email: boolean;
  deposits_inapp: boolean;
  withdrawals_email: boolean;
  withdrawals_inapp: boolean;
  security_email: boolean;
  security_inapp: boolean;
  announcements_email: boolean;
  announcements_inapp: boolean;
  reports_email: boolean;
  reports_inapp: boolean;
  raise_email: boolean;
  raise_inapp: boolean;
  /** Per-event email switches, narrowing the Capital raising category. */
  raise_event_interest_email: boolean;
  raise_event_withdrawn_email: boolean;
  raise_event_cancelled_email: boolean;
  locale: string | null;
  /** Hold emails between the quiet start/end hours (customer's time zone). */
  quiet_hours_enabled: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  time_zone: string;
  /** Capital raising cadence: instant, daily or weekly digest. */
  raise_digest: "instant" | "daily" | "weekly";
  digest_hour: number;
};

const DEFAULTS: NotificationPreferences = {
  kyc_email: true,
  kyc_inapp: true,
  deposits_email: true,
  deposits_inapp: true,
  withdrawals_email: true,
  withdrawals_inapp: true,
  security_email: true,
  security_inapp: true,
  announcements_email: true,
  announcements_inapp: true,
  reports_email: true,
  reports_inapp: true,
  raise_email: true,
  raise_inapp: true,
  raise_event_interest_email: true,
  raise_event_withdrawn_email: true,
  raise_event_cancelled_email: true,
  locale: null,
  quiet_hours_enabled: false,
  quiet_hours_start: 21,
  quiet_hours_end: 7,
  time_zone: "UTC",
  raise_digest: "instant",
  digest_hour: 8,
};

/** Current customer's channel preferences, falling back to all-on defaults. */
export const getNotificationPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NotificationPreferences> => {
    const { data } = await context.supabase
      .from("notification_preferences")
      .select(
        "kyc_email, kyc_inapp, deposits_email, deposits_inapp, withdrawals_email, withdrawals_inapp, security_email, security_inapp, announcements_email, announcements_inapp, reports_email, reports_inapp, raise_email, raise_inapp, raise_event_interest_email, raise_event_withdrawn_email, raise_event_cancelled_email, locale, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, time_zone, raise_digest, digest_hour",
      )
      .eq("user_id", context.userId)
      .maybeSingle();
    const row = (data ?? {}) as Record<string, unknown>;
    return {
      ...DEFAULTS,
      ...row,
      raise_digest: normalizeDigest(row["raise_digest"]),
      time_zone: safeTimeZone(row["time_zone"]),
    };
  });

export const updateNotificationPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Partial<NotificationPreferences>) => input)
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { user_id: context.userId };
    for (const key of Object.keys(DEFAULTS) as (keyof NotificationPreferences)[]) {
      if (key === "locale") {
        if (data.locale !== undefined) patch.locale = data.locale;
      } else if (key === "time_zone") {
        if (data.time_zone !== undefined) patch.time_zone = safeTimeZone(data.time_zone);
      } else if (key === "raise_digest") {
        if (data.raise_digest !== undefined) patch.raise_digest = normalizeDigest(data.raise_digest);
      } else if (key === "quiet_hours_start" || key === "quiet_hours_end" || key === "digest_hour") {
        if (data[key] !== undefined) patch[key] = normalizeHour(data[key], DEFAULTS[key]);
      } else if (data[key] !== undefined) {
        patch[key] = Boolean(data[key]);
      }
    }
    const { error } = await context.supabase
      .from("notification_preferences")
      .upsert(patch as never, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true as const, message: "Notification preferences saved." };
  });
