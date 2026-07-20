import { describe, it, expect } from "vitest";
import { hashEmail, maskEmailForAudit } from "./audit.server";

describe("hashEmail", () => {
  it("is deterministic across calls", () => {
    expect(hashEmail("user@example.com")).toBe(hashEmail("user@example.com"));
  });

  it("normalizes case and surrounding whitespace", () => {
    expect(hashEmail("  User@Example.COM  ")).toBe(hashEmail("user@example.com"));
  });

  it("produces different hashes for different emails", () => {
    expect(hashEmail("a@example.com")).not.toBe(hashEmail("b@example.com"));
  });

  it("returns a 64-char hex sha256 digest", () => {
    expect(hashEmail("user@example.com")).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("maskEmailForAudit", () => {
  it("masks the local part and domain name but keeps the TLD", () => {
    const masked = maskEmailForAudit("jane@example.com");
    expect(masked).toMatch(/^j•+e@e•+e\.com$/);
  });

  it("handles short local parts safely", () => {
    expect(maskEmailForAudit("ab@example.com")).toMatch(/^a•@/);
  });

  it("returns a placeholder for malformed input", () => {
    expect(maskEmailForAudit("not-an-email")).toBe("•••");
  });
});
