import { describe, expect, it } from "vitest";
import type { RaiseHistoryEvent } from "@/lib/raise-history";
import {
  buildRaiseHistoryCsv,
  raiseHistoryCsvFileName,
} from "@/lib/raise-history-export";
import {
  filterRaiseHistoryByRange,
  hasRaiseHistoryRange,
  isRaiseEventInRange,
  normalizeRaiseHistoryRange,
  raiseHistoryRangeLabel,
  raiseHistoryRangeSlug,
} from "@/lib/raise-history-range";

function ev(key: string, at: string | null): RaiseHistoryEvent {
  return {
    key,
    label: key,
    detail: "detail",
    at,
    actor: "Capital markets desk",
    tone: "progress",
    amount: null,
    reference: null,
    note: null,
    downloadable: false,
  } as RaiseHistoryEvent;
}

const events = [
  ev("a", "2026-01-05T09:00:00.000Z"),
  ev("b", "2026-02-14T12:00:00.000Z"),
  ev("c", "2026-03-30T23:30:00.000Z"),
  ev("d", null),
];

describe("raise history date range", () => {
  it("keeps everything when no range is selected", () => {
    expect(hasRaiseHistoryRange({ from: null, to: null })).toBe(false);
    expect(filterRaiseHistoryByRange(events, { from: null, to: null })).toHaveLength(4);
    expect(raiseHistoryRangeLabel(null)).toBe("All dates");
    expect(raiseHistoryRangeSlug(null)).toBeNull();
  });

  it("filters inclusively on whole days", () => {
    const keys = filterRaiseHistoryByRange(events, {
      from: new Date("2026-01-05T18:00:00.000Z"),
      to: new Date("2026-02-14T01:00:00.000Z"),
    }).map((e) => e.key);
    expect(keys).toEqual(["a", "b"]);
  });

  it("drops events without a timestamp once a range is set", () => {
    expect(isRaiseEventInRange(ev("x", null), { from: new Date("2026-01-01"), to: null })).toBe(false);
  });

  it("supports open-ended bounds", () => {
    expect(
      filterRaiseHistoryByRange(events, { from: new Date("2026-02-01"), to: null }).map((e) => e.key),
    ).toEqual(["b", "c"]);
    expect(
      filterRaiseHistoryByRange(events, { from: null, to: new Date("2026-01-31") }).map((e) => e.key),
    ).toEqual(["a"]);
  });

  it("swaps reversed selections and ignores invalid dates", () => {
    const bounds = normalizeRaiseHistoryRange({
      from: new Date("2026-03-01"),
      to: new Date("2026-01-01"),
    });
    expect(bounds.from!.toISOString().slice(0, 10)).toBe("2026-01-01");
    expect(bounds.to!.toISOString().slice(0, 10)).toBe("2026-03-01");
    expect(normalizeRaiseHistoryRange({ from: new Date("nope"), to: null }).from).toBeNull();
  });

  it("labels single days and ranges", () => {
    const day = new Date("2026-02-14T00:00:00.000Z");
    expect(raiseHistoryRangeLabel({ from: day, to: day })).not.toContain("–");
    expect(raiseHistoryRangeLabel({ from: day, to: new Date("2026-03-01T00:00:00.000Z") })).toContain("–");
    expect(raiseHistoryRangeLabel({ from: null, to: day })).toContain("Until");
  });

  it("records the range in the CSV export and its file name", () => {
    const range = { from: new Date("2026-01-01T00:00:00.000Z"), to: new Date("2026-02-28T00:00:00.000Z") };
    const csv = buildRaiseHistoryCsv({
      events: filterRaiseHistoryByRange(events, range),
      roundName: "Series C",
      currency: "USD",
      investorName: "Investor",
      generatedAt: "2026-03-01T00:00:00.000Z",
      rangeLabel: raiseHistoryRangeLabel(range),
    });
    expect(csv).toContain("Date range");
    expect(csv).toContain("Events,2");
    expect(
      raiseHistoryCsvFileName({
        roundName: "Series C",
        generatedAt: "2026-03-01T00:00:00.000Z",
        rangeSlug: raiseHistoryRangeSlug(range),
      }),
    ).toBe("gf3x-series-c-status-history-2026-01-01-2026-02-28-2026-03-01.csv");
  });
});
