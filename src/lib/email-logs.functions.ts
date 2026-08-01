import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-gated read of the Lovable managed email delivery log, used by the
 * admin console to verify OTP / password-reset delivery and troubleshoot
 * failures (rejected, bounced, suppressed, rate-limited sends).
 */

export const EMAIL_EVENT_TYPES = [
  "sent",
  "rejected",
  "bounced",
  "complained",
  "unsubscribed",
  "suppressed",
  "rate_limited",
] as const;
export type EmailEventType = (typeof EMAIL_EVENT_TYPES)[number];

export type EmailLogRow = {
  timestamp: string;
  recipient: string;
  eventType: string;
  status: string | null;
  messageId: string | null;
  /** Provider/webhook event identifier (`event_id`), when the platform returns one. */
  eventId: string | null;
  /** Webhook delivery reference (`delivery_id` / `run_id` / `replay_id`), when present. */
  deliveryId: string | null;
  tags: string[];
  /**
   * Every field the email platform returned for this event, including any
   * provider response / header metadata beyond the documented shape. Carried as
   * JSON text so it stays serializable across the RPC boundary; the log detail
   * drawer parses and renders it.
   */
  rawJson: string;
};


export type EmailLogsResult = {
  rows: EmailLogRow[];
  historyStartsAt: string | null;
  hasMore: boolean;
  /** Present when delivery history could not be read at all. */
  unavailable?: string;
};

type Input = {
  recipient?: string;
  eventType?: string;
  days?: number;
};

/** Serializes the raw provider event, dropping anything non-serializable. */
function toJsonSafe(input: Record<string, unknown>): string {
  try {
    return JSON.stringify(input);
  } catch {
    return "{}";
  }
}

export const listAdminEmailLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input) => {
    const recipient = input.recipient?.trim().slice(0, 200) || undefined;
    const eventType =
      input.eventType && (EMAIL_EVENT_TYPES as readonly string[]).includes(input.eventType)
        ? input.eventType
        : undefined;
    const days = Number.isFinite(input.days) ? Math.min(Math.max(Number(input.days), 1), 90) : 7;
    return { recipient, eventType, days };
  })
  .handler(async ({ data, context }): Promise<EmailLogsResult> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return {
        rows: [],
        historyStartsAt: null,
        hasMore: false,
        unavailable: "Email delivery history is not configured for this project.",
      };
    }

    const since = new Date(Date.now() - data.days * 24 * 60 * 60 * 1000).toISOString();

    try {
      const { listEmailLogs } = await import("@lovable.dev/email-js");
      const res = await listEmailLogs(
        {
          limit: 100,
          since,
          ...(data.recipient ? { recipient: data.recipient } : {}),
          ...(data.eventType ? { event_type: data.eventType } : {}),
        },
        { apiKey },
      );
      return {
        rows: res.data.map((e) => ({
          timestamp: e.timestamp,
          recipient: e.recipient,
          eventType: e.event_type,
          status: e.status ?? null,
          messageId: e.message_id ?? null,
          tags: e.tags ?? [],
          rawJson: toJsonSafe(e as unknown as Record<string, unknown>),
        })),
        historyStartsAt: res.history_starts_at ?? null,
        hasMore: Boolean(res.pagination?.has_more),
      };
    } catch (err) {
      return {
        rows: [],
        historyStartsAt: null,
        hasMore: false,
        unavailable: (err as Error).message,
      };
    }
  });
