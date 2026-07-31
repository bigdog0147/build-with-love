import { describe, it, expect, beforeEach } from "vitest";
import { validateExternalSupabaseEnv } from "./env-validation";

describe("debug", () => {
  beforeEach(() => {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("EXT_SUPABASE_")) {
        delete process.env[key];
      }
    }
  });

  it("shows placeholder detection", () => {
    process.env.EXT_SUPABASE_URL = "https://your-external-project-ref.supabase.co";
    process.env.EXT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_your_external_anon_key";
    process.env.EXT_SUPABASE_SECRET_KEY = "sb_secret_your_external_service_role_key";
    process.env.EXT_SUPABASE_JWKS_URL = "https://your-external-project-ref.supabase.co/auth/v1/.well-known/jwks.json";

    const result = validateExternalSupabaseEnv();
    console.log(JSON.stringify(result, null, 2));
    console.log("ENV:", {
      url: process.env.EXT_SUPABASE_URL,
      pub: process.env.EXT_SUPABASE_PUBLISHABLE_KEY,
      sec: process.env.EXT_SUPABASE_SECRET_KEY,
      jwks: process.env.EXT_SUPABASE_JWKS_URL,
    });
    expect(true).toBe(true);
  });
});
