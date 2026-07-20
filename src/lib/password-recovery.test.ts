import { describe, it, expect } from "vitest";
import {
  isRecoveryClaims,
  passwordSchema,
  RECOVERY_MAX_AGE_SECONDS,
} from "./password-recovery.functions";

function makeClaims(overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    exp: now + 30 * 60,
    iat: now - 60,
    aal: "aal1",
    amr: [{ method: "otp", timestamp: now - 60 }],
    email: "user@example.com",
    ...overrides,
  };
}

describe("isRecoveryClaims", () => {
  it("accepts a fresh, well-formed recovery session", () => {
    expect(isRecoveryClaims(makeClaims())).toEqual({ ok: true });
  });

  it("rejects an expired session (exp in the past)", () => {
    const now = Math.floor(Date.now() / 1000);
    const v = isRecoveryClaims(makeClaims({ exp: now - 10 }));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/expired/i);
  });

  it("rejects a session issued too long ago (stale iat)", () => {
    const now = Math.floor(Date.now() / 1000);
    const v = isRecoveryClaims(
      makeClaims({ iat: now - RECOVERY_MAX_AGE_SECONDS - 30 }),
    );
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/too old/i);
  });

  it("rejects a session issued in the future beyond skew tolerance", () => {
    const now = Math.floor(Date.now() / 1000);
    const v = isRecoveryClaims(makeClaims({ iat: now + 300 }));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/invalid/i);
  });

  it("rejects a session missing the recovery/otp amr entry", () => {
    const v = isRecoveryClaims(makeClaims({ amr: [{ method: "password" }] }));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/recovery link/i);
  });

  it("rejects a session with an unexpected assurance level", () => {
    const v = isRecoveryClaims(makeClaims({ aal: "aal2" }));
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/assurance/i);
  });

  it("rejects a session missing iat", () => {
    const v = isRecoveryClaims(makeClaims({ iat: 0 }));
    expect(v.ok).toBe(false);
  });

  it("rejects when the amr timestamp itself is stale", () => {
    const now = Math.floor(Date.now() / 1000);
    const v = isRecoveryClaims(
      makeClaims({
        amr: [
          { method: "otp", timestamp: now - RECOVERY_MAX_AGE_SECONDS - 60 },
        ],
      }),
    );
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/too old/i);
  });
});

describe("passwordSchema", () => {
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("Str0ng!Passw0rd#42").success).toBe(true);
  });

  it("rejects passwords shorter than 12 characters", () => {
    expect(passwordSchema.safeParse("Ab1!short").success).toBe(false);
  });

  it("rejects passwords without a symbol", () => {
    expect(passwordSchema.safeParse("Abcdefghij12").success).toBe(false);
  });

  it("rejects passwords without a digit", () => {
    expect(passwordSchema.safeParse("Abcdefghij!!").success).toBe(false);
  });

  it("rejects passwords without an uppercase letter", () => {
    expect(passwordSchema.safeParse("abcdefghij1!").success).toBe(false);
  });

  it("rejects passwords with leading or trailing spaces", () => {
    expect(passwordSchema.safeParse(" Str0ng!Passw0rd#").success).toBe(false);
    expect(passwordSchema.safeParse("Str0ng!Passw0rd# ").success).toBe(false);
  });
});
