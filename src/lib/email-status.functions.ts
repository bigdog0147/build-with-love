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
