import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-gated rendering and test-sending of the KYC status email so the exact
 * content of each decision state can be verified before it reaches applicants.
 */

export const KYC_EMAIL_STATUSES = [
  "submitted",
  "under_review",
  "verified",
  "rejected",
] as const;
export type KycEmailStatus = (typeof KYC_EMAIL_STATUSES)[number];

export const KYC_STATUS_LABEL: Record<KycEmailStatus, string> = {
  submitted: "Submitted",
  under_review: "In review",
  verified: "Approved",
  rejected: "Needs changes",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type KycEmailPreview = {
  status: KycEmailStatus;
  subject: string;
  html: string;
  text: string;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

function validate(input: { status: string; name?: string }) {
  if (!KYC_EMAIL_STATUSES.includes(input.status as KycEmailStatus))
    throw new Error("Invalid status");
  return {
    status: input.status as KycEmailStatus,
    name: (input.name ?? "").trim().slice(0, 80) || undefined,
  };
}

/** Render one KYC status email exactly as it would be sent. */
export const renderKycEmailPreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }): Promise<KycEmailPreview> => {
    await assertAdmin(context);

    const React = await import("react");
    const { render } = await import("@react-email/render");
    const { TEMPLATES } = await import("@/lib/email-templates/registry");

    const entry = TEMPLATES["kyc-status"];
    if (!entry) throw new Error("The KYC status template is not registered.");

    const templateData = { status: data.status, name: data.name ?? "Alex Morgan" };

    // Mirror the send path: an active admin-edited version wins over the built-in.
    const { resolveTemplateOverride } = await import("@/lib/email-template-overrides.server");
    const override = await resolveTemplateOverride("kyc-status", templateData);
    if (override) {
      return {
        status: data.status,
        subject: override.subject,
        html: override.html,
        text: override.text,
      };
    }

    const element = React.createElement(entry.component, templateData);
    const html = await render(element);
    const text = await render(element, { plainText: true });
    const subject =
      typeof entry.subject === "function" ? entry.subject(templateData) : entry.subject;

    return { status: data.status, subject, html, text };
  });

export type TestSendResult = { ok: true; email: string } | { ok: false; reason: string };

/** Send a real copy of one KYC status email to a chosen inbox for verification. */
export const sendKycEmailTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status: string; name?: string; to: string }) => {
    const base = validate(input);
    const to = input.to.trim().toLowerCase();
    if (!EMAIL_RE.test(to)) throw new Error("Enter a valid email address");
    return { ...base, to };
  })
  .handler(async ({ data, context }): Promise<TestSendResult> => {
    await assertAdmin(context);
    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      const res = await sendTemplateEmail("kyc-status", data.to, {
        templateData: { status: data.status, name: data.name ?? "Alex Morgan" },
        idempotencyKey: `kyc-status-test-${data.status}-${data.to}-${Date.now()}`,
      });
      if (!res.sent) {
        return {
          ok: false,
          reason:
            res.reason === "recipient_suppressed"
              ? "That inbox is blocked from receiving email (earlier bounce, complaint or unsubscribe)."
              : (res.reason ?? "The test email was not accepted for delivery."),
        };
      }
      return { ok: true, email: data.to };
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
