import { describe, expect, it } from "vitest";
import { computeBackoffMs, isRetryableEmailError } from "./email-retry.server";

describe("isRetryableEmailError", () => {
  it("does not retry terminal server states", () => {
    expect(isRetryableEmailError({ code: "domain_not_verified" })).toBe(false);
    expect(isRetryableEmailError({ code: "emails_disabled" })).toBe(false);
    expect(isRetryableEmailError({ code: "recipient_suppressed" })).toBe(false);
  });

  it("retries rate limits and server errors", () => {
    expect(isRetryableEmailError({ status: 429 })).toBe(true);
    expect(isRetryableEmailError({ status: 503 })).toBe(true);
    expect(isRetryableEmailError(new Error("network down"))).toBe(true);
  });

  it("does not retry other client errors", () => {
    expect(isRetryableEmailError({ status: 400 })).toBe(false);
    expect(isRetryableEmailError({ status: 404 })).toBe(false);
  });
});

describe("computeBackoffMs", () => {
  const opts = { baseDelayMs: 1000, maxDelayMs: 30000 };

  it("grows exponentially within the jitter window", () => {
    expect(computeBackoffMs(1, opts, () => 1)).toBe(1000);
    expect(computeBackoffMs(2, opts, () => 1)).toBe(2000);
    expect(computeBackoffMs(3, opts, () => 1)).toBe(4000);
    expect(computeBackoffMs(1, opts, () => 0)).toBe(500);
  });

  it("caps at maxDelayMs", () => {
    expect(computeBackoffMs(10, opts, () => 1)).toBe(30000);
  });

  it("honours retry-after over the exponential schedule", () => {
    expect(computeBackoffMs(1, { ...opts, retryAfterSeconds: 12 }, () => 1)).toBe(12000);
    expect(computeBackoffMs(1, { ...opts, retryAfterSeconds: 600 }, () => 1)).toBe(30000);
  });
});
