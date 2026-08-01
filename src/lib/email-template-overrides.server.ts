// Server-only: resolves admin-authored overrides for transactional templates.
// When an active version exists for a template + status, its stored subject and
// bodies replace the built-in React Email render.

export type TemplateOverride = {
  subject: string;
  html: string;
  text: string;
  version: number;
};

export const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  under_review: "In review",
  verified: "Approved",
  rejected: "Needs changes",
};

/** Replaces {{name}} / {{status_label}} / {{status}} tokens with escaped values. */
export function applyPlaceholders(
  source: string,
  data: Record<string, unknown>,
  escape: boolean,
): string {
  const esc = (v: string) =>
    escape
      ? v
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
      : v;
  const status = String(data["status"] ?? "submitted");
  const values: Record<string, string> = {
    name: String(data["name"] ?? "").trim() || "there",
    status,
    status_label: STATUS_LABELS[status] ?? status,
  };
  return source.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) =>
    key in values ? esc(values[key]!) : match,
  );
}

/**
 * Loads the active override for a template/status, or null when the built-in
 * component should be used. Never throws — a lookup failure falls back to the
 * built-in template so sends are not blocked.
 */
export async function resolveTemplateOverride(
  templateName: string,
  templateData: Record<string, unknown>,
): Promise<TemplateOverride | null> {
  const statusKey = String(templateData["status"] ?? "").trim();
  if (!statusKey) return null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("email_template_versions")
      .select("subject, html_body, text_body, version")
      .eq("template_name", templateName)
      .eq("status_key", statusKey)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as {
      subject: string;
      html_body: string;
      text_body: string;
      version: number;
    };
    return {
      subject: applyPlaceholders(row.subject, templateData, false),
      html: applyPlaceholders(row.html_body, templateData, true),
      text: applyPlaceholders(row.text_body, templateData, false),
      version: row.version,
    };
  } catch {
    return null;
  }
}
