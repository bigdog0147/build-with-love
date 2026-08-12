import { describe, expect, it } from "vitest";
import { encodeSkipReason, parseSkipReason } from "./dispatch-skip-reason";

describe("dispatch skip reason", () => {
  it("keeps the code first so filters still match", () => {
    const detail = encodeSkipReason({
      code: "event_opted_out",
      event: "interest-withdrawn-1",
      source: "raise_event_withdrawn_email",
    });
    expect(detail.startsWith("event_opted_out")).toBe(true);
    expect(detail).toContain("event=interest-withdrawn-1");
    expect(detail).toContain("source=raise_event_withdrawn_email");
  });

  it("round-trips event and preference source", () => {
    const parsed = parseSkipReason(
      encodeSkipReason({ code: "event_opted_out", event: "commitment-cancelled-2", source: "raise_event_cancelled_email" }),
    );
    expect(parsed).toEqual({
      code: "event_opted_out",
      event: "commitment-cancelled-2",
      source: "raise_event_cancelled_email",
    });
  });

  it("handles plain legacy reasons and empty details", () => {
    expect(parseSkipReason("customer_opted_out")).toEqual({ code: "customer_opted_out" });
    expect(parseSkipReason(null)).toBeNull();
    expect(parseSkipReason("")).toBeNull();
  });
});
