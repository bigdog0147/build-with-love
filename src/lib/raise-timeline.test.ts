import { describe, expect, it } from "vitest";
import { raiseTimeline } from "@/lib/raise-timeline";
const base = { roundStatus: "open", currency: "USD", idStatus: "verified" };
describe("raiseTimeline", () => {
  it("starts at register interest", () => {
    const t = raiseTimeline(base);
    expect(t.stages[0]!.state).toBe("current");
    expect(t.nextStep).toMatch(/non-binding/);
  });
  it("waits during desk review", () => {
    const t = raiseTimeline({ ...base, interest: { status: "submitted" } });
    expect(t.stages[1]!.state).toBe("current");
  });
  it("blocks funding when unverified", () => {
    const t = raiseTimeline({ ...base, idStatus: "submitted", interest: { status: "invited" } });
    expect(t.stages[2]!.state).toBe("blocked");
  });
  it("awaits acceptance once funded", () => {
    const t = raiseTimeline({ ...base, interest: { status: "invited" }, commitment: { status: "funded" } });
    expect(t.stages[3]!.state).toBe("current");
  });
  it("completes on acceptance", () => {
    const t = raiseTimeline({ ...base, interest: { status: "invited" }, commitment: { status: "accepted" } });
    expect(t.stages.every((s) => s.state === "done")).toBe(true);
  });
  it("marks released journeys", () => {
    const t = raiseTimeline({ ...base, interest: { status: "invited" }, commitment: { status: "released" } });
    expect(t.ended).toBe("released");
  });
});
