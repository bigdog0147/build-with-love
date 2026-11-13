import { describe, expect, it } from "vitest";
import {
  allocationSlices,
  comparisonDelta,
  comparisonPoints,
  performanceSeries,
  rangeStart,
  seriesDelta,
} from "./portfolio-series";

const now = new Date("2026-06-15T00:00:00Z");

const holdings = [
  { id: "h1", product_id: "p1", invested: 100000, current_value: 118000, created_at: "2026-01-10T00:00:00Z" },
  { id: "h2", product_id: "p2", invested: 50000, current_value: 52000, created_at: "2026-04-01T00:00:00Z" },
];

const products = [
  { id: "p1", name: "Cell Line A", sector: "Energy", category: "Battery" },
  { id: "p2", name: "Robotics Cell", sector: "Robotics", category: "Automation" },
];

describe("rangeStart", () => {
  it("returns null for ALL", () => {
    expect(rangeStart("ALL", now)).toBeNull();
  });
  it("uses Jan 1 for YTD", () => {
    expect(rangeStart("YTD", now)).toBe("2026-01-01");
  });
  it("subtracts months and years", () => {
    expect(rangeStart("3M", now)).toBe("2026-03-15");
    expect(rangeStart("1Y", now)).toBe("2025-06-15");
  });
});

describe("performanceSeries", () => {
  it("returns nothing without holdings", () => {
    expect(performanceSeries({ holdings: [], valuations: [], range: "ALL", now })).toEqual([]);
  });

  it("falls back to cost basis before the first valuation and uses live value today", () => {
    const points = performanceSeries({
      holdings,
      valuations: [{ holding_id: "h1", as_of: "2026-03-01", value: 110000 }],
      distributions: [{ holding_id: "h1", amount: 2000, paid_at: "2026-05-01" }],
      range: "ALL",
      now,
    });
    const first = points[0]!;
    expect(first.date).toBe("2026-01-10");
    expect(first.value).toBe(100000);
    expect(first.invested).toBe(100000);

    const march = points.find((p) => p.date === "2026-03-01")!;
    expect(march.value).toBe(110000);

    const last = points[points.length - 1]!;
    expect(last.date).toBe("2026-06-15");
    expect(last.value).toBe(170000);
    expect(last.income).toBe(2000);
    expect(last.total).toBe(172000);
  });

  it("excludes holdings that did not exist yet", () => {
    const points = performanceSeries({ holdings, valuations: [], range: "ALL", now });
    expect(points[0]!.invested).toBe(100000);
    expect(points.find((p) => p.date === "2026-04-01")!.invested).toBe(150000);
  });

  it("keeps at least two points when the window has no recorded history", () => {
    const points = performanceSeries({
      holdings,
      valuations: [{ holding_id: "h1", as_of: "2026-01-15", value: 101000 }],
      range: "1M",
      now,
    });
    expect(points.length).toBeGreaterThanOrEqual(2);
  });

  it("filters to the selected range when enough history exists", () => {
    const points = performanceSeries({
      holdings,
      valuations: [
        { holding_id: "h1", as_of: "2026-01-15", value: 101000 },
        { holding_id: "h1", as_of: "2026-06-01", value: 117000 },
        { holding_id: "h2", as_of: "2026-06-05", value: 51500 },
      ],
      range: "1M",
      now,
    });
    expect(points.every((p) => p.date >= "2026-05-15")).toBe(true);
  });
});

describe("allocationSlices", () => {
  it("splits current value by sector with percentages summing to 100", () => {
    const slices = allocationSlices({ holdings, products, dimension: "sector" });
    expect(slices.map((s) => s.label)).toEqual(["Energy", "Robotics"]);
    expect(slices.reduce((a, s) => a + s.percent, 0)).toBeCloseTo(100, 6);
    expect(slices[0]!.value).toBe(118000);
  });

  it("supports project and category dimensions and labels unknown products", () => {
    expect(allocationSlices({ holdings, products, dimension: "project" })[0]!.label).toBe("Cell Line A");
    expect(allocationSlices({ holdings, products, dimension: "category" })[0]!.label).toBe("Battery");
    const orphan = allocationSlices({
      holdings: [{ id: "x", product_id: "missing", invested: 1, current_value: 10 }],
      products,
      dimension: "sector",
    });
    expect(orphan[0]!.label).toBe("Unclassified");
  });

  it("drops zero-value holdings", () => {
    expect(
      allocationSlices({
        holdings: [{ id: "z", product_id: "p1", invested: 0, current_value: 0 }],
        products,
        dimension: "sector",
      }),
    ).toEqual([]);
  });
});

describe("seriesDelta", () => {
  it("is neutral with fewer than two points", () => {
    expect(seriesDelta([])).toEqual({ absolute: 0, percent: 0 });
  });
  it("measures first to last total", () => {
    const d = seriesDelta([
      { date: "a", value: 100, invested: 100, income: 0, total: 100 },
      { date: "b", value: 110, invested: 100, income: 5, total: 115 },
    ]);
    expect(d.absolute).toBe(15);
    expect(d.percent).toBeCloseTo(15);
  });
});

describe("allocationSlices drilldown", () => {
  it("exposes underlying holdings with amounts and slice shares", () => {
    const slices = allocationSlices({
      holdings: [
        ...holdings,
        { id: "h3", product_id: "p1", invested: 20000, current_value: 22000, created_at: "2026-05-01T00:00:00Z" },
      ],
      products,
      dimension: "sector",
    });
    const energy = slices.find((s) => s.label === "Energy")!;
    expect(energy.value).toBe(140000);
    expect(energy.invested).toBe(120000);
    expect(energy.gain).toBe(20000);
    expect(energy.holdings.map((h) => h.holdingId)).toEqual(["h1", "h3"]);
    expect(energy.holdings.reduce((a, h) => a + h.shareOfSlice, 0)).toBeCloseTo(100, 6);
    expect(energy.holdings[0]!.project).toBe("Cell Line A");
    expect(energy.holdings[0]!.category).toBe("Battery");
    expect(energy.holdings[0]!.gainPct).toBeCloseTo(18, 6);
  });

  it("labels unknown products in the drilldown rows", () => {
    const slices = allocationSlices({
      holdings: [{ id: "x", product_id: "missing", invested: 100, current_value: 90 }],
      products,
      dimension: "category",
    });
    expect(slices[0]!.holdings[0]!.project).toBe("Unlisted project");
    expect(slices[0]!.holdings[0]!.gain).toBe(-10);
  });
});

describe("comparison modes", () => {
  const pts = [
    { date: "2026-03-01", value: 100, invested: 90, income: 0, total: 100 },
    { date: "2026-04-01", value: 120, invested: 90, income: 5, total: 125 },
  ];
  const history = [
    { date: "2026-01-01", value: 70, invested: 90, income: 0, total: 70 },
    { date: "2026-02-01", value: 80, invested: 90, income: 0, total: 80 },
    ...pts,
  ];

  it("returns null comparisons when off", () => {
    expect(comparisonPoints({ points: pts, mode: "none" }).map((p) => p.compare)).toEqual([null, null]);
  });

  it("compares against invested capital", () => {
    expect(comparisonPoints({ points: pts, mode: "invested" }).map((p) => p.compare)).toEqual([90, 90]);
  });

  it("compounds the benchmark from the window opening value", () => {
    const out = comparisonPoints({ points: pts, mode: "benchmark", benchmarkAnnualRate: 0.12 });
    expect(out[0]!.compare).toBeCloseTo(100, 6);
    expect(out[1]!.compare).toBeCloseTo(100 * Math.pow(1.12, 31 / 365), 6);
  });

  it("shifts the previous period back by one window length", () => {
    const out = comparisonPoints({ points: pts, allPoints: history, mode: "previous" });
    // window = 31 days; 2026-03-01 - 31d = 2026-01-29 -> latest known total is 70
    expect(out[0]!.compare).toBe(70);
    // 2026-04-01 - 31d = 2026-03-01 -> 100
    expect(out[1]!.compare).toBe(100);
  });

  it("returns null before history begins", () => {
    const out = comparisonPoints({ points: pts, allPoints: pts, mode: "previous" });
    expect(out[0]!.compare).toBeNull();
  });

  it("summarises the delta against the reference", () => {
    const out = comparisonPoints({ points: pts, mode: "invested" });
    const d = comparisonDelta(out)!;
    expect(d.reference).toBe(90);
    expect(d.absolute).toBeCloseTo(35, 6);
    expect(d.percent).toBeCloseTo((35 / 90) * 100, 6);
  });

  it("has no delta when nothing is comparable", () => {
    expect(comparisonDelta(comparisonPoints({ points: pts, mode: "none" }))).toBeNull();
  });
});
