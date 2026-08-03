import { describe, expect, it } from "vitest";
import {
  buildPortfolioCsv,
  buildPortfolioReportHtml,
  csvCell,
  portfolioCsvFileName,
} from "./portfolio-export";
import type { AllocationSlice, ComparisonPoint } from "./portfolio-series";

const points: ComparisonPoint[] = [
  { date: "2026-03-01", value: 100, invested: 90, income: 0, total: 100, compare: 90 },
  { date: "2026-04-01", value: 120, invested: 90, income: 5, total: 125, compare: null },
];

const slices: AllocationSlice[] = [
  {
    key: "robotics",
    label: "Robotics, Inc.",
    value: 125,
    percent: 100,
    invested: 90,
    gain: 35,
    gainPct: 38.89,
    holdings: [
      {
        holdingId: "h1",
        productId: "p1",
        project: "Line 7",
        sector: "Robotics, Inc.",
        category: "Growth",
        invested: 90,
        value: 125,
        gain: 35,
        gainPct: 38.89,
        shareOfSlice: 100,
      },
    ],
  },
];

const input = {
  points,
  slices,
  dimension: "sector" as const,
  range: "3M",
  comparisonLabel: "Invested",
  currency: "USD",
  investorName: "Ada Prosper",
  generatedAt: "2026-04-02T10:00:00.000Z",
};

describe("csvCell", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
    expect(csvCell(null)).toBe("");
  });
});

describe("buildPortfolioCsv", () => {
  const csv = buildPortfolioCsv(input);

  it("includes the header metadata", () => {
    expect(csv).toContain("Gigafactory 3X — Portfolio export");
    expect(csv).toContain("Investor,Ada Prosper");
    expect(csv).toContain("Range,3M");
    expect(csv).toContain("Currency,USD");
  });

  it("writes the performance rows with the comparison column", () => {
    expect(csv).toContain("Date,Portfolio value,Income received,Value + income,Invested,Invested");
    expect(csv).toContain("2026-03-01,100.00,0.00,100.00,90.00,90.00");
    // Null comparisons stay blank rather than becoming 0.
    expect(csv).toContain("2026-04-01,120.00,5.00,125.00,90.00,");
  });

  it("omits the comparison column when comparison is off", () => {
    const plain = buildPortfolioCsv({ ...input, comparisonLabel: undefined });
    expect(plain).toContain("Date,Portfolio value,Income received,Value + income,Invested\r\n");
    expect(plain).toContain("2026-03-01,100.00,0.00,100.00,90.00\r\n");
  });

  it("writes allocation and holdings sections, escaping labels", () => {
    expect(csv).toContain("Allocation by sector");
    expect(csv).toContain('"Robotics, Inc.",125.00,100.00,90.00,35.00,38.89');
    expect(csv).toContain("Holdings");
    expect(csv).toContain("Line 7");
  });

  it("uses CRLF line endings", () => {
    expect(csv.split("\r\n").length).toBeGreaterThan(10);
  });
});

describe("buildPortfolioReportHtml", () => {
  const doc = buildPortfolioReportHtml(input);

  it("names the file from range and date", () => {
    expect(doc.fileName).toBe("gf3x-portfolio-3m-2026-04-02.html");
    expect(portfolioCsvFileName({ range: "ALL", generatedAt: input.generatedAt })).toBe(
      "gf3x-portfolio-all-2026-04-02.csv",
    );
  });

  it("summarises the window change", () => {
    expect(doc.html).toContain("Portfolio Report");
    expect(doc.html).toContain("Ada Prosper");
    expect(doc.html).toContain("+25.00%");
  });

  it("escapes html in labels", () => {
    const hostile = buildPortfolioReportHtml({
      ...input,
      investorName: '<script>alert("x")</script>',
    });
    expect(hostile.html).not.toContain("<script>alert");
    expect(hostile.html).toContain("&lt;script&gt;");
  });

  it("handles an empty portfolio without crashing", () => {
    const empty = buildPortfolioReportHtml({ ...input, points: [], slices: [] });
    expect(empty.html).toContain("No holdings recorded.");
    expect(empty.html).toContain("No valuations recorded for this window.");
  });
});
