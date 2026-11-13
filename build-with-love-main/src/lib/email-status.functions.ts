import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-gated read of Lovable managed email delivery events, scoped to the
 * KYC decision emails sent to one applicant.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EmailDeliveryEvent = {
  timestamp: string;
  recipient: string;
  eventType: string;
  status: string | null;
  messageId: string | null;
};

export type KycEmailDelivery = {
  email: string | null;
  events: EmailDeliveryEvent[];
  historyStartsAt: string | null;
  /** Present when delivery history could not be read (e.g. domain not verified yet). */
  unavailable?: string;
};

export const getKycEmailDelivery = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!UUID_RE.test(input.userId)) throw new Error("Invalid user id");
    return input;
  })
  .handler(async ({ data, context }): Promise<KycEmailDelivery> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    const email = userRes?.user?.email ?? null;
    if (!email) {
      return { email: null, events: [], historyStartsAt: null, unavailable: "No email address on file for this applicant." };
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { email, events: [], historyStartsAt: null, unavailable: "Email delivery history is not configured." };
    }

    try {
      const { listEmailLogs } = await import("@lovable.dev/email-js");
      const res = await listEmailLogs({ recipient: email, limit: 50 }, { apiKey });
      const events = res.data
        .filter((e) => !e.tags || e.tags.length === 0 || e.tags.includes("kyc-status"))
        .map((e) => ({
          timestamp: e.timestamp,
          recipient: e.recipient,
          eventType: e.event_type,
          status: e.status ?? null,
          messageId: e.message_id ?? null,
        }));
      return { email, events, historyStartsAt: res.history_starts_at ?? null };
    } catch (err) {
      return { email, events: [], historyStartsAt: null, unavailable: (err as Error).message };
    }
  });

export type ResendKycEmailResult =
  | { ok: true; status: string; email: string }
  | { ok: false; reason: string };

/**
 * Manually re-send the KYC decision email for one applicant. Admins only.
 * Uses a time-based idempotency key so the retry is not de-duplicated against
 * the original automatic send.
 */
export const resendKycDecisionEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => {
    if (!UUID_RE.test(input.userId)) throw new Error("Invalid user id");
    return input;
  })
  .handler(async ({ data, context }): Promise<ResendKycEmailResult> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    const email = userRes?.user?.email;
    if (!email) return { ok: false, reason: "No email address on file for this applicant." };

    const { externalSupabaseAdmin } = await import("./external-supabase.server");
    const { data: row, error } = await externalSupabaseAdmin()
      .from("kyc_profiles")
      .select("id_status")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (error) return { ok: false, reason: error.message };

    const status = (row as { id_status?: string } | null)?.id_status ?? "not_started";
    if (status === "not_started")
      return { ok: false, reason: "This applicant has no decision to send yet." };

    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      const res = await sendTemplateEmail("kyc-status", email, {
        templateData: { status },
        idempotencyKey: `kyc-status-${status}-${data.userId}-retry-${Date.now()}`,
      });
      if (!res.sent) {
        return {
          ok: false,
          reason:
            res.reason === "recipient_suppressed"
              ? "This recipient is blocked from receiving email (earlier bounce, complaint or unsubscribe), so the retry was not delivered."
              : (res.reason ?? "The email was not accepted for delivery."),
        };
      }
      return { ok: true, status, email };
    } catch (err) {
      const e = err as { code?: string; status?: number; retryAfterSeconds?: number | null; message?: string };
      if (e.status === 429)
        return {
          ok: false,
          reason: `Sending is rate limited — try again in ${e.retryAfterSeconds ?? 60} seconds.`,
        };
      if (e.code === "domain_not_verified")
        return { ok: false, reason: "The sending domain is not verified yet, so the retry could not be sent." };
      if (e.code === "emails_disabled")
        return { ok: false, reason: "Email sending is currently disabled for this project." };
      return { ok: false, reason: e.message ?? "The retry failed." };
    }
  });
