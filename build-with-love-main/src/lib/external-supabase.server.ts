import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireExternalSupabaseEnv } from "./env-validation";

/**
 * Clients for the external Supabase project (qoxnctanpljukzkdeekj).
 * Server-only: this file is never bundled into the browser.
 */

function withApiKey(key: string) {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    // New-format sb_ keys are opaque strings, not JWTs.
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function make(key: string): SupabaseClient {
  requireExternalSupabaseEnv();
  const url = process.env.EXT_SUPABASE_URL;
  if (!url || !key) {
    throw new Error(
      "External Supabase is not configured. Missing EXT_SUPABASE_URL or key.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: { fetch: withApiKey(key) },
  });
}

/** Anon-level client — respects RLS on the external project. */
export function externalSupabase() {
  return make(process.env.EXT_SUPABASE_PUBLISHABLE_KEY!);
}

/** Service-role client — bypasses RLS. Only after authorizing the caller. */
export function externalSupabaseAdmin() {
  return make(process.env.EXT_SUPABASE_SECRET_KEY!);
}

export function externalJwksUrl() {
  return (
    process.env.EXT_SUPABASE_JWKS_URL ??
    `${process.env.EXT_SUPABASE_URL}/auth/v1/.well-known/jwks.json`
  );
}
