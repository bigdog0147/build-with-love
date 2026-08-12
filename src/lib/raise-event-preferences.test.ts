import { describe, expect, it } from "vitest";
import { raiseEventEmailAllowed, raiseEventPrefKey } from "./raise-event-preferences";

describe("raiseEventPrefKey", () => {
  it("maps interest submissions and resubmissions", () => {
    expect(raiseEventPrefKey("interest-submitted")).toBe("raise_event_interest_email");
    expect(raiseEventPrefKey("interest-resubmitted-abc")).toBe("raise_event_interest_email");
  });

  it("maps withdrawals and cancellations", () => {
    expect(raiseEventPrefKey("interest-withdrawn-abc")).toBe("raise_event_withdrawn_email");
    expect(raiseEventPrefKey("commitment-cancelled-abc")).toBe("raise_event_cancelled_email");
  });

  it("returns null for unmapped or empty events", () => {
    expect(raiseEventPrefKey("commitment-funded")).toBeNull();
    expect(raiseEventPrefKey("")).toBeNull();
    expect(raiseEventPrefKey(undefined)).toBeNull();
  });
});

describe("raiseEventEmailAllowed", () => {
  it("defaults to allowed when no preference row exists", () => {
    expect(raiseEventEmailAllowed(null, "interest-submitted")).toBe(true);
    expect(raiseEventEmailAllowed({}, "interest-submitted")).toBe(true);
  });

  it("blocks only the matching event", () => {
    const prefs = { raise_event_withdrawn_email: false };
    expect(raiseEventEmailAllowed(prefs, "interest-withdrawn-1")).toBe(false);
    expect(raiseEventEmailAllowed(prefs, "interest-submitted")).toBe(true);
  });

  it("allows unmapped events regardless of per-event switches", () => {
    expect(raiseEventEmailAllowed({ raise_event_interest_email: false }, "commitment-funded")).toBe(true);
  });
});
