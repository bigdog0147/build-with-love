import { describe, expect, it } from "vitest";
import type { RaiseHistoryEvent } from "./raise-history";
import {
  filterRaiseHistory,
  raiseHistoryCategory,
  raiseHistoryCounts,
  raiseHistoryFilterLabel,
  raiseHistoryFilterSlug,
  type RaiseHistoryCategory,
} from "./raise-history-filters";
import {
  buildRaiseHistoryCsv,
  buildRaiseHistoryReportHtml,
  raiseHistoryCsvFileName,
} from "./raise-history-export";

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

describe("filter labels for exports", () => {
  it("defaults to all types when nothing is selected", () => {
    expect(raiseHistoryFilterLabel([])).toBe("All event types");
    expect(raiseHistoryFilterSlug([])).toBeNull();
  });

  it("labels and slugs selected types in chip order", () => {
    expect(raiseHistoryFilterLabel(["decision", "round"])).toBe("Round, Desk decision");
    expect(raiseHistoryFilterSlug(["decision", "round"])).toBe("round-decision");
  });
});

describe("exports follow the active filters", () => {
  const events = [
    { key: "round-open", at: "2026-01-01T00:00:00.000Z", label: "Round opened", detail: "d", actor: "Capital markets desk", tone: "progress" },
    { key: "interest-invited", at: "2026-01-05T00:00:00.000Z", label: "Invitation issued", detail: "d", actor: "Capital markets desk", tone: "success" },
  ] as RaiseHistoryEvent[];

  it("csv only contains the filtered events and names the filter", () => {
    const active: RaiseHistoryCategory[] = ["decision"];
    const csv = buildRaiseHistoryCsv({
      events: filterRaiseHistory(events, active),
      roundName: "Series C",
      currency: "USD",
      investorName: "Ada",
      generatedAt: "2026-02-01T00:00:00.000Z",
      filterLabel: raiseHistoryFilterLabel(active),
      filterSlug: raiseHistoryFilterSlug(active),
    });
    expect(csv).toContain("Event types,Desk decision");
    expect(csv).toContain("Invitation issued");
    expect(csv).not.toContain("Round opened");
    expect(csv).toContain("Events,1");
  });

  it("pdf lede and file names carry the filter", () => {
    const active: RaiseHistoryCategory[] = ["decision"];
    const doc = buildRaiseHistoryReportHtml({
      events: filterRaiseHistory(events, active),
      roundName: "Series C",
      currency: "USD",
      investorName: "Ada",
      generatedAt: "2026-02-01T00:00:00.000Z",
      filterLabel: raiseHistoryFilterLabel(active),
      filterSlug: raiseHistoryFilterSlug(active),
    });
    expect(doc.html).toContain("Event types: Desk decision");
    expect(doc.html).not.toContain("Round opened");
    expect(doc.fileName).toContain("-decision-");
    expect(
      raiseHistoryCsvFileName({
        roundName: "Series C",
        generatedAt: "2026-02-01T00:00:00.000Z",
        filterSlug: raiseHistoryFilterSlug(active),
      }),
    ).toBe("gf3x-series-c-status-history-decision-2026-02-01.csv");
  });
});
