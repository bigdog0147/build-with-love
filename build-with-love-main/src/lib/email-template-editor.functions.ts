import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { KYC_EMAIL_STATUSES, type KycEmailStatus } from "@/lib/email-preview.functions";
import {
  validateTemplateDraft,
  type ValidationIssue,
} from "@/lib/email-template-validation";

export type SaveResult =
  | { ok: true; version: number }
  | { ok: false; issues: ValidationIssue[] };



/**
 * Admin editing of the KYC decision email content (subject, HTML body and
 * plain-text body) with a full saved version history and one-click rollback.
 */

export type TemplateVersion = {
  id: string;
  status_key: string;
  version: number;
  subject: string;
  html_body: string;
  text_body: string;
  note: string | null;
  is_active: boolean;
  created_at: string;
};

export type EditorState = {
  status: KycEmailStatus;
  /** Content currently in effect: the active saved version, or the built-in default. */
  subject: string;
  html: string;
  text: string;
  source: "custom" | "built-in";
  activeVersion: number | null;
  versions: TemplateVersion[];
  /** Built-in render, always available as a reset baseline. */
  builtIn: { subject: string; html: string; text: string };
};

const TEMPLATE = "kyc-status";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

function parseStatus(value: unknown): KycEmailStatus {
  if (!KYC_EMAIL_STATUSES.includes(value as KycEmailStatus)) throw new Error("Invalid status");
  return value as KycEmailStatus;
}

async function renderBuiltIn(status: KycEmailStatus) {
  const React = await import("react");
  const { render } = await import("@react-email/render");
  const { TEMPLATES } = await import("@/lib/email-templates/registry");
  const entry = TEMPLATES[TEMPLATE];
  if (!entry) throw new Error("The KYC status template is not registered.");
  const templateData = { status, name: "{{name}}" };
  const element = React.createElement(entry.component, templateData);
  const subject =
    typeof entry.subject === "function" ? entry.subject(templateData) : entry.subject;
  return {
    subject,
    html: await render(element),
    text: await render(element, { plainText: true }),
  };
}

/** Editor state for one decision status: current content plus version history. */
export const getEmailTemplateEditorState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status: string }) => ({ status: parseStatus(input.status) }))
  .handler(async ({ data, context }): Promise<EditorState> => {
    await assertAdmin(context);

    const { data: rows, error } = await context.supabase
      .from("email_template_versions")
      .select("id, status_key, version, subject, html_body, text_body, note, is_active, created_at")
      .eq("template_name", TEMPLATE)
      .eq("status_key", data.status)
      .order("version", { ascending: false });
    if (error) throw new Error(error.message);

    const versions = (rows ?? []) as TemplateVersion[];
    const active = versions.find((v) => v.is_active) ?? null;
    const builtIn = await renderBuiltIn(data.status);

    return {
      status: data.status,
      subject: active?.subject ?? builtIn.subject,
      html: active?.html_body ?? builtIn.html,
      text: active?.text_body ?? builtIn.text,
      source: active ? "custom" : "built-in",
      activeVersion: active?.version ?? null,
      versions,
      builtIn,
    };
  });

/** Saves edited content as a new version and makes it the active one. */
export const saveEmailTemplateVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { status: string; subject: string; html: string; text: string; note?: string }) => ({
      status: parseStatus(input.status),
      subject: input.subject ?? "",
      html: input.html ?? "",
      text: input.text ?? "",
      note: (input.note ?? "").trim().slice(0, 200) || null,
    }),
  )

  .handler(async ({ data, context }): Promise<SaveResult> => {
    await assertAdmin(context);

    // Authoritative validation: returns field-level issues instead of throwing so
    // the admin editor can render them inline next to the offending field.
    const issues = validateTemplateDraft(data);
    if (issues.length > 0) return { ok: false, issues };
    const subject = data.subject.trim();
    const html = data.html.trim();
    const text = data.text.trim();


    const { supabase, userId } = context;

    const { data: latest, error: latestErr } = await supabase
      .from("email_template_versions")
      .select("version")
      .eq("template_name", TEMPLATE)
      .eq("status_key", data.status)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestErr) throw new Error(latestErr.message);
    const nextVersion = ((latest as { version?: number } | null)?.version ?? 0) + 1;

    const deactivate = await supabase
      .from("email_template_versions")
      .update({ is_active: false })
      .eq("template_name", TEMPLATE)
      .eq("status_key", data.status)
      .eq("is_active", true);
    if (deactivate.error) throw new Error(deactivate.error.message);

    const insert = await supabase.from("email_template_versions").insert({
      template_name: TEMPLATE,
      status_key: data.status,
      version: nextVersion,
      subject,
      html_body: html,
      text_body: text,

      note: data.note,
      is_active: true,
      created_by: userId,
    });
    if (insert.error) throw new Error(insert.error.message);

    return { ok: true, version: nextVersion };
  });

/** Rolls back: makes an earlier saved version the active one again. */
export const activateEmailTemplateVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status: string; versionId: string }) => {
    if (!input.versionId) throw new Error("Pick a version to restore.");
    return { status: parseStatus(input.status), versionId: input.versionId };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const { supabase } = context;

    const off = await supabase
      .from("email_template_versions")
      .update({ is_active: false })
      .eq("template_name", TEMPLATE)
      .eq("status_key", data.status)
      .eq("is_active", true);
    if (off.error) throw new Error(off.error.message);

    const on = await supabase
      .from("email_template_versions")
      .update({ is_active: true })
      .eq("id", data.versionId)
      .eq("template_name", TEMPLATE)
      .eq("status_key", data.status)
      .select("id")
      .maybeSingle();
    if (on.error) throw new Error(on.error.message);
    if (!on.data) throw new Error("That version no longer exists.");

    return { ok: true };
  });

/** Reverts to the built-in template by deactivating every custom version. */
export const revertToBuiltInTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status: string }) => ({ status: parseStatus(input.status) }))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context);
    const res = await context.supabase
      .from("email_template_versions")
      .update({ is_active: false })
      .eq("template_name", TEMPLATE)
      .eq("status_key", data.status)
      .eq("is_active", true);
    if (res.error) throw new Error(res.error.message);
    return { ok: true };
  });
