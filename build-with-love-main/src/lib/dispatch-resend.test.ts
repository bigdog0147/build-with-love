import { describe, expect, it } from "vitest";
import { isResendKey, resendIdempotencyKey } from "./dispatch-resend";

describe("resendIdempotencyKey", () => {
  it("derives a key distinct from the original", () => {
    expect(resendIdempotencyKey("raise-advance-1", "abc")).toBe("raise-advance-1:resend:abc");
  });

  it("is stable per audit row so two clicks cannot duplicate a send", () => {
    expect(resendIdempotencyKey("k", "row-1")).toBe(resendIdempotencyKey("k", "row-1"));
    expect(resendIdempotencyKey("k", "row-1")).not.toBe(resendIdempotencyKey("k", "row-2"));
  });

  it("does not chain suffixes when resending a resend", () => {
    const first = resendIdempotencyKey("k", "row-1");
    expect(resendIdempotencyKey(first, "row-2")).toBe("k:resend:row-2");
  });

  it("handles jobs dispatched without an original key", () => {
    expect(resendIdempotencyKey(null, "row-9")).toBe("resend:row-9");
    expect(isResendKey(resendIdempotencyKey(undefined, "row-9"))).toBe(true);
  });

  it("recognises non-resend keys", () => {
    expect(isResendKey("raise-advance-1")).toBe(false);
  });
});
