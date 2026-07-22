// End-to-end flow test for the password reset resend UX.
//
// This test simulates a full user journey across TWO surfaces:
//   1. Forgot-password form on src/routes/auth.tsx
//   2. Expired-link resend panel on src/routes/reset-password.tsx
//
// It exercises the shared logic modules (recovery-hint persistence,
// resend cooldown math) and cross-checks the source of both UI surfaces
// so wiring — button disablement, success-panel rendering, aria-live
// announcements — cannot silently regress. We stop short of mounting
// React (no jsdom in vitest config) but cover the invariants an E2E
// browser test would assert: cooldown blocks the button, the success
// panel appears with the neutral copy, and the masked hint survives
// the forgot-password → reset-page navigation.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { computeCooldown, RESEND_COOLDOWN_SECONDS } from "./resend-cooldown";

// --- fake localStorage shared by both "pages" (like a real browser) ---
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

// The reset page uses its own key for the resend timestamp (see
// src/routes/reset-password.tsx). Keep in sync so the simulation
// mirrors what the real component writes.
const RESET_PAGE_RESEND_KEY = "gf3:reset-resend-last";

beforeEach(() => {
  store.clear();
  vi.resetModules();
});

const authSrc = readFileSync(
  resolve(__dirname, "../routes/auth.tsx"),
  "utf8",
);
const resetSrc = readFileSync(
  resolve(__dirname, "../routes/reset-password.tsx"),
  "utf8",
);

describe("E2E: forgot-password → expired link → resend flow", () => {
  it("step 1: submitting the forgot-password form persists a masked hint the reset page can read", async () => {
    const { saveRecoveryHint } = await import("./recovery-hint");
    // User types their address into auth.tsx and hits "Send reset link".
    const masked = saveRecoveryHint("Jane.Doe@Example.com");
    expect(masked).toBeTruthy();
    expect(masked).toMatch(/•/);
    // They click the emailed link, but it's expired. Reset page loads —
    // simulate its "readRecoveryHint()" state initializer.
    vi.resetModules();
    const { readRecoveryHint } = await import("./recovery-hint");
    expect(readRecoveryHint()).toBe(masked);
  });

  it("step 2: right after a resend, cooldown is active and the button-disabled expression is truthy", () => {
    // Simulate the reset page performing a successful resend and writing
    // its timestamp to localStorage (see reset-password.tsx `resend()`).
    const now = 1_700_000_000_000;
    store.setItem(RESET_PAGE_RESEND_KEY, String(now));

    // Re-read exactly like the component's effect does.
    const raw = window.localStorage.getItem(RESET_PAGE_RESEND_KEY);
    const last = raw ? parseInt(raw, 10) : 0;
    const cooldown = computeCooldown(last, now);
    expect(cooldown).toBe(RESEND_COOLDOWN_SECONDS);

    // Reproduce the component's `disabled` expression:
    //   disabled = !emailValid || sending || cooldown > 0
    const emailValid = true;
    const sending = false;
    const disabled = !emailValid || sending || cooldown > 0;
    expect(disabled).toBe(true);
  });

  it("step 3: cooldown decays with time and unlocks the button once it hits 0", () => {
    const sentAt = 1_700_000_000_000;
    store.setItem(RESET_PAGE_RESEND_KEY, String(sentAt));

    const last = parseInt(store.getItem(RESET_PAGE_RESEND_KEY)!, 10);

    // Mid-cooldown: still disabled.
    const mid = computeCooldown(last, sentAt + 20_000);
    expect(mid).toBe(RESEND_COOLDOWN_SECONDS - 20);
    expect(mid > 0).toBe(true);

    // Just before expiry: last disabled tick.
    const almost = computeCooldown(last, sentAt + (RESEND_COOLDOWN_SECONDS - 1) * 1000);
    expect(almost).toBe(1);

    // After the window: unlocked.
    const after = computeCooldown(last, sentAt + RESEND_COOLDOWN_SECONDS * 1000);
    expect(after).toBe(0);
    const disabled = !true || false || after > 0;
    expect(disabled).toBe(false);
  });

  it("step 4: cooldown survives a simulated full reload (timestamp is persisted, not in-memory)", () => {
    const sentAt = 1_700_000_000_000;
    store.setItem(RESET_PAGE_RESEND_KEY, String(sentAt));

    // Simulate reload by clearing every JS reference except localStorage
    // and re-reading — that's exactly what a fresh browser session does.
    vi.resetModules();
    const persisted = parseInt(
      window.localStorage.getItem(RESET_PAGE_RESEND_KEY)!,
      10,
    );
    expect(persisted).toBe(sentAt);
    expect(computeCooldown(persisted, sentAt + 30_000)).toBe(
      RESEND_COOLDOWN_SECONDS - 30,
    );
  });
});

describe("E2E: reset-page source wires cooldown → button/aria correctly", () => {
  it("declares cooldown state, an effect that decrements it, and gates disabled on it", () => {
    expect(resetSrc).toMatch(/const\s+\[cooldown,\s*setCooldown\]\s*=\s*useState\(\s*0\s*\)/);
    // The disabled expression must include `cooldown > 0`.
    expect(resetSrc).toMatch(/disabled\s*=\s*!emailValid\s*\|\|\s*sending\s*\|\|\s*cooldown\s*>\s*0/);
    // The button binds disabled and aria-disabled to that flag.
    expect(resetSrc).toMatch(/disabled=\{disabled\}/);
    expect(resetSrc).toMatch(/aria-disabled=\{disabled\}/);
  });

  it("persists the resend timestamp on a successful send", () => {
    expect(resetSrc).toContain('"gf3:reset-resend-last"');
    expect(resetSrc).toMatch(/localStorage\.setItem\([^)]*RESEND_STORAGE_KEY[^)]*Date\.now\(\)/);
  });

  it("renders a screen-reader live region with the remaining-time announcement", () => {
    expect(resetSrc).toMatch(/role="status"/);
    expect(resetSrc).toMatch(/aria-live="polite"/);
    expect(resetSrc).toMatch(/Resend available in \$\{cooldown\} second/);
    expect(resetSrc).toMatch(/Resend is now available\./);
  });

  it("shows the neutral success panel guarded by `sent && !error`", () => {
    expect(resetSrc).toMatch(/\{sent && !error && \(/);
    expect(resetSrc).toMatch(
      /we show the same confirmation\s*whether or not an account exists/i,
    );
  });
});

describe("E2E: forgot-password (auth.tsx) success panel matches reset page copy", () => {
  it("both panels share the invariant neutral disclosure", () => {
    const invariant =
      "we show the same confirmation whether or not an account exists";
    const norm = (s: string) => s.replace(/\s+/g, " ").toLowerCase();
    expect(norm(authSrc)).toContain(invariant);
    expect(norm(resetSrc)).toContain(invariant);
  });

  it("auth.tsx persists the masked hint that the reset page then reads", () => {
    expect(authSrc).toMatch(/saveRecoveryHint\s*\(/);
    expect(resetSrc).toMatch(/readRecoveryHint\s*\(/);
  });
});
