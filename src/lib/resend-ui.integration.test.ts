// Integration tests: the resend reset-email UI must
//   1. show the SAME masked hint before and after a "refresh"
//   2. use the SAME neutral wording regardless of whether the account exists
// We assert this at two layers:
//   (a) the recovery-hint persistence module (survives module re-imports)
//   (b) the server function contract + the source of both UI surfaces
//       (auth.tsx sent panel, reset-password.tsx resend confirmation)
//       — both must render identical wording and rely on the persisted hint.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// -------- fake localStorage backing a fake window --------
class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
  key(i: number) { return Array.from(this.m.keys())[i] ?? null; }
  get length() { return this.m.size; }
}

const store = new MemStorage();
(globalThis as unknown as { window: { localStorage: MemStorage } }).window = {
  localStorage: store,
};

beforeEach(() => {
  store.clear();
  vi.resetModules();
});

async function importHint() {
  return await import("./recovery-hint");
}

describe("recovery hint persists across a refresh", () => {
  it("returns the same masked hint after simulated page reload", async () => {
    const { saveRecoveryHint } = await importHint();
    const masked = saveRecoveryHint("Jane.Doe@Example.com");
    expect(masked).toBeTruthy();

    // Simulate a full refresh: drop the module graph, keep storage.
    vi.resetModules();
    const { readRecoveryHint } = await importHint();
    expect(readRecoveryHint()).toBe(masked);
  });

  it("returns the same hint whether the account exists or not (client can't tell)", async () => {
    const { saveRecoveryHint, readRecoveryHint } = await importHint();
    // The client only ever calls saveRecoveryHint with the typed email —
    // there is no branch for "account exists". Prove it by calling it twice
    // with different addresses and confirming both round-trip identically.
    const a = saveRecoveryHint("real.user@example.com");
    expect(readRecoveryHint()).toBe(a);
    store.clear();
    const b = saveRecoveryHint("missing.user@example.com");
    expect(readRecoveryHint()).toBe(b);
    // Both take the same shape: local mask + "@" + domain mask + tld
    expect(a).toMatch(/^.+•.*@.+•.*\..+$/);
    expect(b).toMatch(/^.+•.*@.+•.*\..+$/);
  });

  it("readRecoveryHint survives multiple reads (idempotent, non-destructive)", async () => {
    const { saveRecoveryHint } = await importHint();
    const masked = saveRecoveryHint("someone@corp.io");

    for (let i = 0; i < 3; i++) {
      vi.resetModules();
      const { readRecoveryHint } = await importHint();
      expect(readRecoveryHint()).toBe(masked);
    }
  });
});

describe("resend server function is enumeration-safe", () => {
  it("always returns { ok: true } regardless of Supabase result", async () => {
    // Verify contract via source — the handler unconditionally returns ok:true
    // and never surfaces the Supabase error to the caller.
    const src = readFileSync(
      resolve(__dirname, "reset-request.functions.ts"),
      "utf8",
    );
    // Only one return in the handler, and it's the neutral shape.
    const returns = src.match(/return\s+\{[^}]*\}/g) ?? [];
    expect(returns).toHaveLength(1);
    expect(returns[0]).toMatch(/ok:\s*true/);
    // The error is captured for audit but not thrown / not returned.
    expect(src).toMatch(/success:\s*!error/);
    expect(src).not.toMatch(/throw\s+error/);
  });
});

describe("both UI surfaces show the same neutral wording + masked hint", () => {
  const authSrc = readFileSync(
    resolve(__dirname, "../routes/auth.tsx"),
    "utf8",
  );
  const resetSrc = readFileSync(
    resolve(__dirname, "../routes/reset-password.tsx"),
    "utf8",
  );

  const norm = (s: string) => s.replace(/\s+/g, " ").toLowerCase();
  const authText = norm(authSrc);
  const resetText = norm(resetSrc);

  it("both include the invariant neutral disclosure", () => {
    const invariant = "we show the same confirmation whether or not an";
    expect(authText).toContain(invariant);
    expect(resetText).toContain(invariant);
  });

  it("both reference the shared masked hint (saveRecoveryHint / maskEmail)", () => {
    expect(authSrc).toMatch(/saveRecoveryHint\s*\(/);
    expect(authSrc).toMatch(/maskEmail\s*\(/);
    // reset-password reads the persisted hint and re-saves on resend
    expect(resetSrc).toMatch(/readRecoveryHint\s*\(/);
    expect(resetSrc).toMatch(/saveRecoveryHint\s*\(/);
  });

  it("neither UI branches its wording on account existence", () => {
    // If either page grew an "account exists" / "no such user" branch we'd
    // regress the neutral guarantee. Ban those substrings outright.
    const forbidden = [
      /no such (user|account)/i,
      /account (does not|doesn't) exist/i,
      /email not found/i,
      /user not found/i,
    ];
    for (const re of forbidden) {
      expect(authSrc).not.toMatch(re);
      expect(resetSrc).not.toMatch(re);
    }
  });
});
