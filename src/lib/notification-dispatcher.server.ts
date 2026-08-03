/**
 * Server-only, preference-aware notification dispatcher.
 *
 * One call fans a platform event out to the in-app inbox and (when the customer
 * allows it for that category) a branded email. Preferences default to "on" so a
 * customer who never visited settings still receives critical notices.
 */
import { serviceClient } from "./admin-guard.server";
import { sendTemplateEmailWithRetry } from "./email-retry.server";

export type NotificationCategory = "kyc" | "deposits" | "withdrawals" | "security" | "announcements" | "reports";

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
};

export type DispatchResult = {
  inapp: boolean;
  email: boolean;
  emailSkippedReason?: string;
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

export async function dispatchNotification(input: DispatchInput): Promise<DispatchResult> {
  const db = await serviceClient();
  const prefs = await loadPreferences(db, input.userId);
  const result: DispatchResult = { inapp: false, email: false };

  if (allows(prefs, input.category, "inapp")) {
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

  if (!allows(prefs, input.category, "email")) {
    result.emailSkippedReason = "customer_opted_out";
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
  if (!sent.sent) result.emailSkippedReason = sent.reason;
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
