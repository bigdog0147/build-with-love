/**
 * Server-only, preference-aware notification dispatcher.
 *
 * One call fans a platform event out to the in-app inbox and (when the customer
 * allows it for that category) a branded email. Preferences default to "on" so a
 * customer who never visited settings still receives critical notices.
 */
import { serviceClient } from "./admin-guard.server";
import { sendTemplateEmailWithRetry } from "./email-retry.server";
import { raiseEventEmailAllowed, raiseEventPrefKey } from "./raise-event-preferences";
import { encodeSkipReason } from "./dispatch-skip-reason";
import { scheduleDelivery, type DeliveryWindow } from "./notification-schedule";

export type NotificationCategory = "kyc" | "deposits" | "withdrawals" | "security" | "announcements" | "reports" | "raise";

export type DispatchInput = {
  userId: string;
  category: NotificationCategory;
  title: string;
  detail: string;
  tone?: "info" | "success" | "warning" | "danger";
  /** Registered email template name; omit to keep the notice in-app only. */
  template?: string;
  templateData?: Record<string, unknown>;
  /** Stable key so retries of the same logical event never duplicate an email. */
  idempotencyKey?: string;
  /** Capital raising only: applies the investor's per-round opt-in/opt-out. */
  roundId?: string;
  /** Capital raising only: event id (e.g. "interest-withdrawn-1") for per-event email switches. */
  raiseEvent?: string;
};

export type DispatchResult = {
  inapp: boolean;
  email: boolean;
  emailSkippedReason?: string;
  /** How many send attempts the email took (retries included). */
  emailAttempts?: number;
  /** True when the failure was transient and another attempt could succeed. */
  emailRetryable?: boolean;
  /** Raise timeline event id when a per-event switch caused the skip. */
  emailSkippedEvent?: string | null;
  /** Preference column that caused the skip, when attributable. */
  emailSkippedSource?: string | null;
  /** Set when quiet hours or a digest cadence pushed the email into the future. */
  emailDeferredUntil?: string;
};

type Prefs = Record<string, boolean>;

/** Reads a customer's channel preferences, treating a missing row as all-on. */
export async function loadPreferences(db: any, userId: string): Promise<Prefs> {
  const { data } = await db
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return {};
  return data as Prefs;
}

function allows(prefs: Prefs, category: NotificationCategory, channel: "email" | "inapp") {
  const key = `${category}_${channel}`;
  const value = prefs[key];
  return value === undefined ? true : Boolean(value);
}

/** Per-round override for capital raising alerts; missing row means "follow globals". */
async function loadRoundOverride(db: any, userId: string, roundId: string) {
  const { data } = await db
    .from("raise_round_preferences")
    .select("email_enabled, inapp_enabled")
    .eq("user_id", userId)
    .eq("round_id", roundId)
    .maybeSingle();
  return (data as { email_enabled: boolean; inapp_enabled: boolean } | null) ?? null;
}

export async function dispatchNotification(input: DispatchInput): Promise<DispatchResult> {
  const db = await serviceClient();
  const prefs = await loadPreferences(db, input.userId);
  const result: DispatchResult = { inapp: false, email: false };

  // Capital raising alerts can be muted round by round from the investor portal.
  let roundAllows = { email: true, inapp: true };
  if (input.category === "raise" && input.roundId) {
    const override = await loadRoundOverride(db, input.userId, input.roundId);
    if (override)
      roundAllows = { email: Boolean(override.email_enabled), inapp: Boolean(override.inapp_enabled) };
  }

  if (allows(prefs, input.category, "inapp") && roundAllows.inapp) {
    const { error } = await db.from("notifications").insert({
      user_id: input.userId,
      kind: input.category,
      title: input.title,
      detail: input.detail,
      tone: input.tone ?? "info",
    });
    if (error) console.error("notification insert failed", error.message);
    else result.inapp = true;
  }

  if (!input.template) return result;

  if (!roundAllows.email) {
    result.emailSkippedReason = "round_muted";
    return result;
  }

  if (!allows(prefs, input.category, "email")) {
    result.emailSkippedReason = "customer_opted_out";
    return result;
  }

  // Per-event switches narrow the Capital raising category further.
  if (input.category === "raise" && !raiseEventEmailAllowed(prefs, input.raiseEvent)) {
    // Record which event was muted and which preference silenced it, so the
    // audit log explains the skip without a second lookup.
    result.emailSkippedReason = encodeSkipReason({
      code: "event_opted_out",
      event: input.raiseEvent ?? null,
      source: raiseEventPrefKey(input.raiseEvent) ?? "raise_event_email",
    });
    result.emailSkippedEvent = input.raiseEvent ?? null;
    result.emailSkippedSource = raiseEventPrefKey(input.raiseEvent) ?? "raise_event_email";
    return result;
  }

  // Quiet hours and digest cadences delay the email, never the in-app notice.
  const decision = scheduleDelivery(input.category, prefs as DeliveryWindow);
  if (decision.mode === "deferred") {
    const { queueDeferredEmail } = await import("./notification-digest.server");
    const queued = await queueDeferredEmail(db, input, decision);
    result.emailSkippedReason = queued ? `deferred_${decision.reason}` : "deferred_queue_failed";
    result.emailDeferredUntil = decision.deliverAfter.toISOString();
    return result;
  }

  const { data: user } = await db.auth.admin.getUserById(input.userId);
  const email = user?.user?.email as string | undefined;
  if (!email) {
    result.emailSkippedReason = "no_email_on_file";
    return result;
  }

  const sent = await sendTemplateEmailWithRetry(input.template, email, {
    templateData: input.templateData ?? {},
    idempotencyKey: input.idempotencyKey,
  });
  result.email = sent.sent;
  result.emailAttempts = sent.attempts;
  if (!sent.sent) {
    result.emailSkippedReason = sent.reason;
    result.emailRetryable = sent.retryable;
  }
  return result;
}

/** Fan-out used by admin broadcasts; returns how many customers were reached. */
export async function dispatchBroadcast(
  userIds: string[],
  payload: Omit<DispatchInput, "userId">,
): Promise<{ inapp: number; email: number }> {
  let inapp = 0;
  let email = 0;
  for (const userId of userIds) {
    const res = await dispatchNotification({
      ...payload,
      userId,
      idempotencyKey: payload.idempotencyKey ? `${payload.idempotencyKey}-${userId}` : undefined,
    });
    if (res.inapp) inapp += 1;
    if (res.email) email += 1;
  }
  return { inapp, email };
}
