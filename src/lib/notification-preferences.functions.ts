import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  locale: string | null;
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
  locale: null,
};

/** Current customer's channel preferences, falling back to all-on defaults. */
export const getNotificationPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NotificationPreferences> => {
    const { data } = await context.supabase
      .from("notification_preferences")
      .select(
        "kyc_email, kyc_inapp, deposits_email, deposits_inapp, withdrawals_email, withdrawals_inapp, security_email, security_inapp, announcements_email, announcements_inapp, reports_email, reports_inapp, raise_email, raise_inapp, locale",
      )
      .eq("user_id", context.userId)
      .maybeSingle();
    return { ...DEFAULTS, ...(data ?? {}) };
  });

export const updateNotificationPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Partial<NotificationPreferences>) => input)
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { user_id: context.userId };
    for (const key of Object.keys(DEFAULTS) as (keyof NotificationPreferences)[]) {
      if (key === "locale") {
        if (data.locale !== undefined) patch.locale = data.locale;
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
