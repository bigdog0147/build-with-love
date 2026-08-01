/**
 * Validation rules for admin-authored KYC email template drafts.
 *
 * Runs on the server inside the save server function (authoritative) and can
 * also be imported by the editor UI to surface problems before saving.
 */

export const TEMPLATE_LIMITS = {
  subject: 300,
  html: 120_000,
  text: 60_000,
} as const;

/** Placeholders that must survive an edit, per field. */
export const REQUIRED_PLACEHOLDERS = {
  html: ["name"],
  text: ["name"],
} as const;

/** Tokens the send path knows how to substitute. */
export const KNOWN_PLACEHOLDERS = ["name", "status", "status_label"] as const;

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const FORBIDDEN_TAGS = ["script", "iframe", "object", "embed", "form"];

export type TemplateDraft = {
  subject: string;
  html: string;
  text: string;
};

export type ValidationIssue = {
  field: "subject" | "html" | "text";
  message: string;
};

function findPlaceholders(source: string): string[] {
  return [...source.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]!);
}

/** Balanced-tag / well-formedness check for a simple HTML email body. */
export function findHtmlStructureIssues(html: string): string[] {
  const issues: string[] = [];
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");

  const openAngles = (stripped.match(/</g) ?? []).length;
  const closeAngles = (stripped.match(/>/g) ?? []).length;
  if (openAngles !== closeAngles) {
    issues.push("There is an unclosed HTML tag (mismatched < and > characters).");
  }

  const stack: string[] = [];
  const tagPattern = /<\s*(\/?)\s*([a-zA-Z][\w:-]*)([^>]*)>/g;
  let match: RegExpExecArray | null;
  while ((match = tagPattern.exec(stripped)) !== null) {
    const isClosing = match[1] === "/";
    const name = match[2]!.toLowerCase();
    const attrs = match[3] ?? "";
    if (name === "!doctype" || VOID_ELEMENTS.has(name)) continue;
    if (attrs.trimEnd().endsWith("/")) continue; // self-closing
    if (isClosing) {
      const last = stack.pop();
      if (!last) {
        issues.push(`Closing tag </${name}> has no matching opening tag.`);
        break;
      }
      if (last !== name) {
        issues.push(`Tag <${last}> is closed by </${name}>; tags must be closed in order.`);
        break;
      }
    } else {
      stack.push(name);
    }
  }
  if (stack.length > 0) {
    issues.push(`Tag <${stack[stack.length - 1]}> is never closed.`);
  }

  for (const tag of FORBIDDEN_TAGS) {
    if (new RegExp(`<\\s*${tag}\\b`, "i").test(stripped)) {
      issues.push(`<${tag}> is not allowed in email templates.`);
    }
  }
  if (/\son[a-z]+\s*=/i.test(stripped)) {
    issues.push("Inline event handler attributes (onclick, onload, …) are not allowed.");
  }
  if (/javascript:/i.test(stripped)) {
    issues.push("javascript: URLs are not allowed.");
  }

  return issues;
}

/** Collects every problem with a draft; empty array means the draft is valid. */
export function validateTemplateDraft(draft: TemplateDraft): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const subject = draft.subject.trim();
  const html = draft.html.trim();
  const text = draft.text.trim();

  if (!subject) issues.push({ field: "subject", message: "The subject line cannot be empty." });
  if (!html) issues.push({ field: "html", message: "The HTML body cannot be empty." });
  if (!text) issues.push({ field: "text", message: "The plain-text body cannot be empty." });

  if (subject.length > TEMPLATE_LIMITS.subject) {
    issues.push({
      field: "subject",
      message: `The subject line is too long (${subject.length} of ${TEMPLATE_LIMITS.subject} characters allowed).`,
    });
  }
  if (html.length > TEMPLATE_LIMITS.html) {
    issues.push({
      field: "html",
      message: `The HTML body is too large (${html.length} of ${TEMPLATE_LIMITS.html} characters allowed).`,
    });
  }
  if (text.length > TEMPLATE_LIMITS.text) {
    issues.push({
      field: "text",
      message: `The plain-text body is too large (${text.length} of ${TEMPLATE_LIMITS.text} characters allowed).`,
    });
  }

  if (html) {
    for (const problem of findHtmlStructureIssues(html)) {
      issues.push({ field: "html", message: problem });
    }
  }

  for (const field of ["html", "text"] as const) {
    const source = field === "html" ? html : text;
    if (!source) continue;
    const present = findPlaceholders(source);
    for (const required of REQUIRED_PLACEHOLDERS[field]) {
      if (!present.includes(required)) {
        issues.push({
          field,
          message: `The ${field === "html" ? "HTML" : "plain-text"} body must include the {{${required}}} placeholder.`,
        });
      }
    }
  }

  for (const field of ["subject", "html", "text"] as const) {
    const source = field === "subject" ? subject : field === "html" ? html : text;
    for (const token of findPlaceholders(source)) {
      if (!(KNOWN_PLACEHOLDERS as readonly string[]).includes(token)) {
        issues.push({
          field,
          message: `Unknown placeholder {{${token}}}. Available: ${KNOWN_PLACEHOLDERS.map((p) => `{{${p}}}`).join(", ")}.`,
        });
      }
    }
  }

  return issues;
}

/** Throws a single readable error when a draft is invalid; returns trimmed content. */
export function assertValidTemplateDraft(draft: TemplateDraft): TemplateDraft {
  const issues = validateTemplateDraft(draft);
  if (issues.length > 0) {
    throw new Error(issues.map((i) => i.message).join(" "));
  }
  return {
    subject: draft.subject.trim(),
    html: draft.html.trim(),
    text: draft.text.trim(),
  };
}
