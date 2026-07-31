import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  validateExternalSupabaseEnv,
  requireExternalSupabaseEnv,
} from "./env-validation";

describe("validateExternalSupabaseEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // clear all EXT_SUPABASE_* variables before each test
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("EXT_SUPABASE_")) {
        delete process.env[key];
      }
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns ok when all required variables are valid", () => {
    process.env.EXT_SUPABASE_URL = "https://abc123.supabase.co";
    process.env.EXT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_validkey";
    process.env.EXT_SUPABASE_SECRET_KEY = "sb_secret_validkey";
    process.env.EXT_SUPABASE_JWKS_URL =
      "https://abc123.supabase.co/auth/v1/.well-known/jwks.json";

    const result = validateExternalSupabaseEnv();
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.missing).toEqual([]);
  });

  it("flags missing variables", () => {
    process.env.EXT_SUPABASE_URL = "https://abc123.supabase.co";
    // leave the rest missing

    const result = validateExternalSupabaseEnv();
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected not ok");
    expect(result.missing).toContain("EXT_SUPABASE_PUBLISHABLE_KEY");
    expect(result.missing).toContain("EXT_SUPABASE_SECRET_KEY");
    expect(result.missing).toContain("EXT_SUPABASE_JWKS_URL");
  });

  it("flags placeholder values as missing", () => {
    process.env.EXT_SUPABASE_URL = "https://your-external-project-ref.supabase.co";
    process.env.EXT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_your_external_anon_key";
    process.env.EXT_SUPABASE_SECRET_KEY = "sb_secret_your_external_service_role_key";
    process.env.EXT_SUPABASE_JWKS_URL =
      "https://your-external-project-ref.supabase.co/auth/v1/.well-known/jwks.json";

    const result = validateExternalSupabaseEnv();
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected not ok");
    expect(result.missing.length).toBe(4);
  });

  it("flags malformed URL", () => {
    process.env.EXT_SUPABASE_URL = "not-a-url";
    process.env.EXT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_validkey";
    process.env.EXT_SUPABASE_SECRET_KEY = "sb_secret_validkey";
    process.env.EXT_SUPABASE_JWKS_URL =
      "https://abc123.supabase.co/auth/v1/.well-known/jwks.json";

    const result = validateExternalSupabaseEnv();
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected not ok");
    expect(result.malformed.length).toBe(1);
    expect(result.malformed[0]).toContain("EXT_SUPABASE_URL");
  });

  it("flags malformed publishable key", () => {
    process.env.EXT_SUPABASE_URL = "https://abc123.supabase.co";
    process.env.EXT_SUPABASE_PUBLISHABLE_KEY = "wrong_prefix_key";
    process.env.EXT_SUPABASE_SECRET_KEY = "sb_secret_validkey";
    process.env.EXT_SUPABASE_JWKS_URL =
      "https://abc123.supabase.co/auth/v1/.well-known/jwks.json";

    const result = validateExternalSupabaseEnv();
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected not ok");
    expect(result.malformed.some((m) => m.includes("EXT_SUPABASE_PUBLISHABLE_KEY"))).toBe(true);
  });

  it("flags malformed secret key", () => {
    process.env.EXT_SUPABASE_URL = "https://abc123.supabase.co";
    process.env.EXT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_validkey";
    process.env.EXT_SUPABASE_SECRET_KEY = "sb_publishable_should_be_secret";
    process.env.EXT_SUPABASE_JWKS_URL =
      "https://abc123.supabase.co/auth/v1/.well-known/jwks.json";

    const result = validateExternalSupabaseEnv();
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected not ok");
    expect(result.malformed.some((m) => m.includes("EXT_SUPABASE_SECRET_KEY"))).toBe(true);
  });

  it("requireExternalSupabaseEnv throws with a helpful message", () => {
    expect(() => requireExternalSupabaseEnv()).toThrow(
      /Copy \.env\.example to \.env/,
    );
  });
});
