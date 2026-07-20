import { describe, it, expect } from "vitest";
import { computeCooldown, RESEND_COOLDOWN_SECONDS } from "./resend-cooldown";

describe("computeCooldown", () => {
  it("returns 0 when there is no previous send", () => {
    expect(computeCooldown(0, Date.now())).toBe(0);
  });

  it("returns the full cooldown right after a send", () => {
    const now = 1_700_000_000_000;
    expect(computeCooldown(now, now)).toBe(RESEND_COOLDOWN_SECONDS);
  });

  it("decreases as time passes", () => {
    const now = 1_700_000_000_000;
    expect(computeCooldown(now, now + 15_000)).toBe(RESEND_COOLDOWN_SECONDS - 15);
    expect(computeCooldown(now, now + 45_000)).toBe(RESEND_COOLDOWN_SECONDS - 45);
  });

  it("returns 0 once the cooldown has elapsed", () => {
    const now = 1_700_000_000_000;
    expect(computeCooldown(now, now + RESEND_COOLDOWN_SECONDS * 1000)).toBe(0);
    expect(computeCooldown(now, now + (RESEND_COOLDOWN_SECONDS + 30) * 1000)).toBe(0);
  });

  it("supports a custom cooldown window", () => {
    const now = 1_700_000_000_000;
    expect(computeCooldown(now, now + 5_000, 30)).toBe(25);
    expect(computeCooldown(now, now + 60_000, 30)).toBe(0);
  });

  it("survives a simulated reload by reading from a persisted timestamp", () => {
    // Emulate localStorage: send happens, page reloads mid-cooldown, timer resumes.
    const store: Record<string, string> = {};
    const sentAt = 1_700_000_000_000;
    store["gf3.reset.resend.last"] = String(sentAt);

    const persisted = parseInt(store["gf3.reset.resend.last"], 10);
    const remaining = computeCooldown(persisted, sentAt + 20_000);
    expect(remaining).toBe(RESEND_COOLDOWN_SECONDS - 20);
  });
});
