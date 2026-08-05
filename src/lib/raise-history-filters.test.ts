import { describe, expect, it } from "vitest";
import type { RaiseHistoryEvent } from "./raise-history";
import {
  filterRaiseHistory,
  raiseHistoryCategory,
  raiseHistoryCounts,
} from "./raise-history-filters";

const event = (key: string): RaiseHistoryEvent => ({
  key,
  at: "2026-01-01T00:00:00.000Z",
  label: key,
  detail: "",
  actor: "System",
  tone: "neutral",
});

describe("raiseHistoryCategory", () => {
  it("groups round lifecycle events", () => {
    expect(raiseHistoryCategory(event("round-open"))).toBe("round");
    expect(raiseHistoryCategory(event("round-funded"))).toBe("round");
  });

  it("separates desk decisions from investor interest", () => {
    expect(raiseHistoryCategory(event("interest-submitted"))).toBe("interest");
    expect(raiseHistoryCategory(event("interest-withdrawn"))).toBe("interest");
    expect(raiseHistoryCategory(event("interest-invited"))).toBe("decision");
    expect(raiseHistoryCategory(event("interest-declined"))).toBe("decision");
  });

  it("groups funding and outcome events", () => {
    expect(raiseHistoryCategory(event("commitment-created"))).toBe("funding");
    expect(raiseHistoryCategory(event("commitment-funded"))).toBe("funding");
    expect(raiseHistoryCategory(event("commitment-cancelled"))).toBe("funding");
    expect(raiseHistoryCategory(event("commitment-accepted"))).toBe("outcome");
    expect(raiseHistoryCategory(event("commitment-released"))).toBe("outcome");
  });
});

describe("raiseHistoryCounts", () => {
  it("counts each category", () => {
    const counts = raiseHistoryCounts([
      event("round-open"),
      event("interest-submitted"),
      event("interest-invited"),
      event("commitment-created"),
      event("commitment-funded"),
      event("commitment-accepted"),
    ]);
    expect(counts).toEqual({ round: 1, interest: 1, decision: 1, funding: 2, outcome: 1 });
  });
});

describe("filterRaiseHistory", () => {
  const events = [
    event("round-open"),
    event("interest-invited"),
    event("commitment-funded"),
    event("commitment-released"),
  ];

  it("returns everything when nothing is selected", () => {
    expect(filterRaiseHistory(events, [])).toHaveLength(4);
  });

  it("keeps only the selected categories, preserving order", () => {
    const result = filterRaiseHistory(events, ["decision", "outcome"]);
    expect(result.map((e) => e.key)).toEqual(["interest-invited", "commitment-released"]);
  });

  it("can return an empty list", () => {
    expect(filterRaiseHistory([event("round-open")], ["funding"])).toEqual([]);
  });
});
