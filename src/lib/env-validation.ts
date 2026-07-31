/**
 * Runtime validation for environment variables.
 * Throws early with a helpful message when required values are missing or malformed.
 */

export type EnvCheckResult =
  | { ok: true; missing: [] }
  | { ok: false; missing: string[]; malformed: string[] };

const REQUIRED_EXT_VARS = [
  "EXT_SUPABASE_URL",
  "EXT_SUPABASE_PUBLISHABLE_KEY",
  "EXT_SUPABASE_SECRET_KEY",
  "EXT_SUPABASE_JWKS_URL",
] as const;

function isNonEmptyString(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  // Reject obvious copy-pasted placeholders such as "your-project-ref" or "your_project_ref".
  return !/your[-_]/i.test(value);
}

function looksLikeSupabaseUrl(value: string): boolean {
  return value.startsWith("https://") && value.endsWith(".supabase.co");
}

function looksLikePublishableKey(value: string): boolean {
  return value.startsWith("sb_publishable_");
}

function looksLikeSecretKey(value: string): boolean {
  return value.startsWith("sb_secret_");
}

function looksLikeJwksUrl(value: string): boolean {
  return value.endsWith("/auth/v1/.well-known/jwks.json");
}

export function validateExternalSupabaseEnv(): EnvCheckResult {
  const missing: string[] = [];
  const malformed: string[] = [];

  for (const name of REQUIRED_EXT_VARS) {
    const value = process.env[name];
    if (!isNonEmptyString(value)) {
      missing.push(name);
      continue;
    }

    switch (name) {
      case "EXT_SUPABASE_URL":
      case "EXT_SUPABASE_JWKS_URL":
        if (!looksLikeSupabaseUrl(value) && !looksLikeJwksUrl(value)) {
          malformed.push(`${name} must be a https://...supabase.co URL`);
        }
        break;
      case "EXT_SUPABASE_PUBLISHABLE_KEY":
        if (!looksLikePublishableKey(value)) {
          malformed.push(`${name} must start with sb_publishable_`);
        }
        break;
      case "EXT_SUPABASE_SECRET_KEY":
        if (!looksLikeSecretKey(value)) {
          malformed.push(`${name} must start with sb_secret_`);
        }
        break;
    }
  }

  if (missing.length > 0 || malformed.length > 0) {
    return { ok: false, missing, malformed };
  }

  return { ok: true, missing: [] };
}

/**
 * Asserts that all EXT_SUPABASE_* variables are configured.
 * Call inside server functions before touching the external backend.
 */
export function requireExternalSupabaseEnv(): void {
  const result = validateExternalSupabaseEnv();
  if (!result.ok) {
    const lines = [
      "External Supabase is not configured correctly.",
      "Copy .env.example to .env and fill in the EXT_SUPABASE_* values.",
      ...result.missing.map((name) => `  - missing: ${name}`),
      ...result.malformed.map((msg) => `  - malformed: ${msg}`),
    ];
    throw new Error(lines.join("\n"));
  }
}
