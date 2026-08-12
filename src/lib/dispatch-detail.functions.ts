import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireAdminPermission, serviceClient } from "./admin-guard.server";
import { parseSkipReason, type SkipReasonDetail } from "./dispatch-skip-reason";
import { normalizeAttemptTrail, type DispatchAttemptRow } from "./dispatch-attempts";

/**
 * Full detail read for one `notification_dispatch_log` row: the stored notice
 * payload, the template re-rendered from that payload, the suppression /
 * preference picture for the recipient, and the provider delivery events the
 * email platform recorded around the dispatch.
 */

export type DispatchPreferenceRow = { key: string; enabled: boolean };

export type DispatchProviderEvent = {
  timestamp: string;
  recipient: string;
  eventType: string;
  status: string | null;
  messageId: string | null;
  rawJson: string;
};

export type DispatchLogDetail = {
  id: string;
  createdAt: string;
  status: string;
  category: string;
  label: string;
  template: string | null;
  idempotencyKey: string | null;
  detail: string | null;
  attempts: number;
  retryable: boolean;
  userId: string | null;
  resentFrom: string | null;
  resentAt: string | null;
  attemptTrail: DispatchAttemptRow[];
  /** Pretty-printed notice snapshot exactly as stored on the audit row. */
  payloadJson: string | null;
  /** The `templateData` slice of that snapshot, pretty-printed. */
  templateDataJson: string | null;
  rendered: { subject: string; html: string; text: string } | null;
  renderError: string | null;
  recipientEmail: string | null;
  suppression: {
    skip: SkipReasonDetail | null;
    /** Preference switches that gate this notice, with their current values. */
    preferences: DispatchPreferenceRow[];
    /** Round-level mute for the raise round this notice belongs to. */
    roundMuted: boolean | null;
    /** True when the platform recorded a bounce/complaint/suppression for the inbox. */
    providerSuppressed: boolean;
    providerSuppressionReason: string | null;
  };
  provider: { events: DispatchProviderEvent[]; unavailable: string | null };
};

const SUPPRESSING_EVENTS = new Set(["bounced", "complained", "unsubscribed", "suppressed"]);

const CATEGORY_PREFERENCE_KEYS: Record<string, string[]> = {
  deposits: ["deposits_email", "deposits_inapp"],
  withdrawals: ["withdrawals_email", "withdrawals_inapp"],
  kyc: ["kyc_email", "kyc_inapp"],
  security: ["security_email", "security_inapp"],
  announcements: ["announcements_email", "announcements_inapp"],
  reports: ["reports_email", "reports_inapp"],
  raise: [
    "raise_email",
    "raise_inapp",
    "raise_event_interest_email",
    "raise_event_withdrawn_email",
    "raise_event_cancelled_email",
  ],
};

function pretty(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return null;
  }
}

export const getDispatchLogEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input.id ?? "").trim() }))
  .handler(async ({ data, context }): Promise<DispatchLogDetail> => {
    await requireAdminPermission(context as never, "notifications");
    if (!/^[0-9a-f-]{36}$/i.test(data.id)) throw new Error("A valid log entry id is required.");

    const db = await serviceClient();
    const { data: row, error } = await db
      .from("notification_dispatch_log")
      .select(
        "id, created_at, user_id, category, template, idempotency_key, label, status, attempts, detail, retryable, payload, resent_from, resent_at, attempt_trail",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("That dispatch log entry no longer exists.");

    const payload = (row.payload ?? null) as Record<string, unknown> | null;
    const templateData = (payload?.["templateData"] ?? null) as Record<string, unknown> | null;
    const skip = parseSkipReason(row.detail as string | null);

    // 1. Re-render the template from the stored payload so the reviewer sees
    //    the exact message the recipient would have received.
    let rendered: DispatchLogDetail["rendered"] = null;
    let renderError: string | null = null;
    const templateName = (row.template as string | null) ?? null;
    if (templateName) {
      try {
        const React = await import("react");
        const { render } = await import("@react-email/render");
        const { TEMPLATES } = await import("@/lib/email-templates/registry");
        const entry = TEMPLATES[templateName];
        if (!entry) {
          renderError = `Template "${templateName}" is no longer registered, so it cannot be re-rendered.`;
        } else {
          const props = (templateData ?? {}) as Record<string, unknown>;
          const element = React.createElement(entry.component, props);
          rendered = {
            subject:
              typeof entry.subject === "function"
                ? entry.subject(props as never)
                : entry.subject,
            html: await render(element),
            text: await render(element, { plainText: true }),
          };
        }
      } catch (err) {
        renderError = (err as Error).message || "The stored payload could not be rendered.";
      }
    }

    // 2. Recipient inbox + the preference switches that gate this category.
    let recipientEmail: string | null = null;
    const preferences: DispatchPreferenceRow[] = [];
    let roundMuted: boolean | null = null;
    const userId = (row.user_id as string | null) ?? null;
    if (userId) {
      try {
        const { data: user } = await db.auth.admin.getUserById(userId);
        recipientEmail = user?.user?.email ?? null;
      } catch {
        recipientEmail = null;
      }

      const keys = CATEGORY_PREFERENCE_KEYS[String(row.category ?? "")] ?? [];
      if (keys.length > 0) {
        const { data: pref } = await db
          .from("notification_preferences")
          .select(keys.join(", "))
          .eq("user_id", userId)
          .maybeSingle();
        const prefRow = (pref ?? null) as Record<string, unknown> | null;
        for (const key of keys) {
          preferences.push({ key, enabled: prefRow ? Boolean(prefRow[key]) : true });
        }
      }

      const roundId = (payload?.["roundId"] as string | null) ?? null;
      if (roundId) {
        const { data: roundPref } = await db
          .from("raise_round_preferences")
          .select("email_enabled, inapp_enabled")
          .eq("user_id", userId)
          .eq("round_id", roundId)
          .maybeSingle();
        const r = (roundPref ?? null) as { email_enabled?: boolean } | null;
        roundMuted = r ? r.email_enabled === false : false;
      }
    }

    // 3. Provider delivery events around the dispatch for this inbox.
    const providerEvents: DispatchProviderEvent[] = [];
    let unavailable: string | null = null;
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!recipientEmail) {
      unavailable = "No recipient inbox is on file for this notice, so provider events cannot be matched.";
    } else if (!apiKey) {
      unavailable = "Email delivery history is not configured for this project.";
    } else {
      try {
        const created = new Date(String(row.created_at)).getTime();
        const since = new Date(
          (Number.isNaN(created) ? Date.now() : created) - 60 * 60 * 1000,
        ).toISOString();
        const { listEmailLogs } = await import("@lovable.dev/email-js");
        const res = await listEmailLogs({ limit: 25, since, recipient: recipientEmail }, { apiKey });
        for (const e of res.data) {
          const raw = e as unknown as Record<string, unknown>;
          providerEvents.push({
            timestamp: e.timestamp,
            recipient: e.recipient,
            eventType: e.event_type,
            status: e.status ?? null,
            messageId: e.message_id ?? null,
            rawJson: (() => {
              try {
                return JSON.stringify(raw, null, 2);
              } catch {
                return "{}";
              }
            })(),
          });
        }
      } catch (err) {
        unavailable = (err as Error).message;
      }
    }

    const suppressing = providerEvents.find((e) => SUPPRESSING_EVENTS.has(e.eventType));

    return {
      id: String(row.id),
      createdAt: String(row.created_at),
      status: String(row.status ?? ""),
      category: String(row.category ?? ""),
      label: String(row.label ?? ""),
      template: templateName,
      idempotencyKey: (row.idempotency_key as string | null) ?? null,
      detail: (row.detail as string | null) ?? null,
      attempts: Number(row.attempts ?? 0),
      retryable: Boolean(row.retryable),
      userId,
      resentFrom: (row.resent_from as string | null) ?? null,
      resentAt: (row.resent_at as string | null) ?? null,
      attemptTrail: normalizeAttemptTrail(row.attempt_trail),
      payloadJson: pretty(payload),
      templateDataJson: pretty(templateData),
      rendered,
      renderError,
      recipientEmail,
      suppression: {
        skip,
        preferences,
        roundMuted,
        providerSuppressed: Boolean(suppressing),
        providerSuppressionReason: suppressing
          ? `${suppressing.eventType}${suppressing.status ? ` (${suppressing.status})` : ""} on ${suppressing.timestamp}`
          : null,
      },
      provider: { events: providerEvents, unavailable },
    };
  });
