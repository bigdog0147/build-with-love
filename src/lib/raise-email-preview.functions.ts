import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  RAISE_EMAIL_EVENTS,
  type RaiseEmailEvent,
  type RaiseEmailVariables,
} from "@/lib/raise-email-scenarios";

export type RaiseEmailPreview = {
  event: RaiseEmailEvent;
  subject: string;
  html: string;
  text: string;
  variables: RaiseEmailVariables;
  overridden: string[];
};

/** Variables an admin may tweak in the preview editor panel. */
export const RAISE_EMAIL_VARIABLE_KEYS = [
  "stageLabel",
  "nextStep",
  "roundName",
  "currency",
  "amount",
  "ended",
  "note",
  "name",
  "confirmationUrl",
  "confirmationTitle",
] as const satisfies readonly (keyof RaiseEmailVariables)[];

export type RaiseEmailVariableKey = (typeof RAISE_EMAIL_VARIABLE_KEYS)[number];

type PreviewInput = { event: string; overrides?: Record<string, string> };

function normalizeOverrides(overrides: Record<string, string> | undefined) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(overrides ?? {})) {
    if (!(RAISE_EMAIL_VARIABLE_KEYS as readonly string[]).includes(key)) continue;
    if (typeof value !== "string") continue;
    out[key] = value.slice(0, 2000);
  }
  return out;
}

function applyOverrides(
  variables: RaiseEmailVariables,
  overrides: Record<string, string>,
): { variables: RaiseEmailVariables; overridden: string[] } {
  const next = { ...variables } as Record<string, unknown>;
  const overridden: string[] = [];
  for (const [key, raw] of Object.entries(overrides)) {
    if (key === "amount") {
      const n = Number(raw);
      if (raw.trim() === "" || !Number.isFinite(n)) continue;
      if (n === variables.amount) continue;
      next.amount = n;
      overridden.push(key);
      continue;
    }
    if (raw === (variables as Record<string, unknown>)[key]) continue;
    next[key] = raw;
    overridden.push(key);
  }
  return { variables: next as RaiseEmailVariables, overridden };
}

/** Render the "Raise timeline advance" email for one event with sample data. */
export const renderRaiseAdvanceEmailPreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: PreviewInput) => {
    if (!RAISE_EMAIL_EVENTS.includes(input.event as RaiseEmailEvent))
      throw new Error("Unknown capital raise event");
    return {
      event: input.event as RaiseEmailEvent,
      overrides: normalizeOverrides(input.overrides),
    };
  })
  .handler(async ({ data, context }): Promise<RaiseEmailPreview> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const React = await import("react");
    const { render } = await import("@react-email/render");
    const { TEMPLATES } = await import("@/lib/email-templates/registry");
    const { raiseEmailTemplateData } = await import("@/lib/raise-email-scenarios");

    const entry = TEMPLATES["raise-timeline-advance"];
    if (!entry) throw new Error("The raise timeline advance template is not registered.");

    const { variables, overridden } = applyOverrides(
      raiseEmailTemplateData(data.event),
      data.overrides,
    );
    const templateData: Record<string, unknown> = Object.fromEntries(
      Object.entries(variables).filter(([, v]) => v !== "" && v !== undefined),
    );

    const element = React.createElement(entry.component, templateData);
    const html = await render(element);
    const text = await render(element, { plainText: true });
    const subject =
      typeof entry.subject === "function" ? entry.subject(templateData as never) : entry.subject;

    return { event: data.event, subject, html, text, variables, overridden };
  });


export type RaiseTestSendResult = { ok: true; email: string } | { ok: false; reason: string };

/**
 * Send a dry-run copy of the raise timeline advance email for one event.
 * The recipient is always the signed-in admin's own verified address — the
 * browser cannot choose an arbitrary inbox.
 */
export const sendRaiseAdvanceEmailTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { event: string }) => {
    if (!RAISE_EMAIL_EVENTS.includes(input.event as RaiseEmailEvent))
      throw new Error("Unknown capital raise event");
    return { event: input.event as RaiseEmailEvent };
  })
  .handler(async ({ data, context }): Promise<RaiseTestSendResult> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const claims = context.claims as { email?: string; email_verified?: boolean };
    const to = claims?.email?.trim().toLowerCase();
    if (!to) return { ok: false, reason: "Your admin account has no email address on file." };

    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      const { raiseEmailTemplateData } = await import("@/lib/raise-email-scenarios");
      const variables = raiseEmailTemplateData(data.event);
      const templateData: Record<string, unknown> = Object.fromEntries(
        Object.entries(variables).filter(([, v]) => v !== "" && v !== undefined),
      );

      const res = await sendTemplateEmail("raise-timeline-advance", to, {
        templateData,
        idempotencyKey: `raise-advance-test-${data.event}-${to}-${Date.now()}`,
      });
      if (!res.sent) {
        return {
          ok: false,
          reason:
            res.reason === "recipient_suppressed"
              ? "Your inbox is blocked from receiving email (earlier bounce, complaint or unsubscribe)."
              : "The test email was not accepted for delivery.",
        };
      }
      return { ok: true, email: to };
    } catch (err) {
      const e = err as {
        code?: string;
        status?: number;
        retryAfterSeconds?: number | null;
        message?: string;
      };
      if (e.status === 429)
        return {
          ok: false,
          reason: `Sending is rate limited — try again in ${e.retryAfterSeconds ?? 60} seconds.`,
        };
      if (e.code === "domain_not_verified")
        return {
          ok: false,
          reason:
            "The sending domain is not verified yet — previews work, but test sends start once verification finishes.",
        };
      if (e.code === "emails_disabled")
        return { ok: false, reason: "Email sending is currently disabled for this project." };
      return { ok: false, reason: e.message ?? "The test send failed." };
    }
  });
