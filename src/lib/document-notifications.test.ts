import { describe, expect, it } from "vitest";
import { MAX_DELIVERY_ATTEMPTS, nextAttemptAt } from "./document-notifications.server";

const base = new Date("2026-01-01T00:00:00.000Z");

describe("nextAttemptAt", () => {
  it("widens the wait between attempts", () => {
    const mins = [1, 2, 3, 4].map((n) => {
      const at = nextAttemptAt(n, base)!;
      return (new Date(at).getTime() - base.getTime()) / 60000;
    });
    expect(mins).toEqual([5, 15, 60, 180]);
  });

  it("gives up once the attempt budget is spent", () => {
    expect(nextAttemptAt(MAX_DELIVERY_ATTEMPTS, base)).toBeNull();
    expect(nextAttemptAt(MAX_DELIVERY_ATTEMPTS + 3, base)).toBeNull();
  });
});
