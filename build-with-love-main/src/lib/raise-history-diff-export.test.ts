import { describe, expect, it } from "vitest";
import {
  RAISE_HISTORY_DIFF_COLUMNS,
  buildRaiseHistoryCsv,
  buildRaiseHistoryExportPreview,
  buildRaiseHistoryReportHtml,
  exportColumns,
  exportRows,
  historyDiffRowCells,
  raiseHistoryCsvFileName,
} from "./raise-history-export";
import type { RaiseHistoryEvent } from "./raise-history";

const events: RaiseHistoryEvent[] = [
  {
    key: "opened",
    label: "Round opened",
    at: "2026-01-05T09:00:00.000Z",
    actor: "Capital markets desk",
    tone: "neutral",
    detail: "Round opened for interest.",
    amount: null,
    note: null,
    reference: null,
    changes: [],
  } as unknown as RaiseHistoryEvent,
  {
    key: "accepted",
    label: "Commitment accepted",
    at: "2026-02-01T12:30:00.000Z",
    actor: "Capital markets desk",
    tone: "positive",
    detail: "Allocation confirmed.",
    amount: 250000,
    note: "Signed subscription received.",
    reference: "GF3X-001",
    changes: [
      { field: "Status", from: "Pending", to: "Accepted" },
      { field: "Amount", from: "100000", to: "250000" },
    ],
  } as unknown as RaiseHistoryEvent,
];

const base = {
  events,
  roundName: "Series C — Robotics",
  currency: "USD",
  investorName: "Ada Investor",
  generatedAt: "2026-03-01T10:00:00.000Z",
  diffOnly: true,
};

describe("diff-only export", () => {
  it("emits one row per changed field and drops unchanged transitions", () => {
    const preview = buildRaiseHistoryExportPreview(base);
    expect(preview.columns).toEqual(RAISE_HISTORY_DIFF_COLUMNS);
    expect(preview.rowCount).toBe(2);
    expect(preview.rows.map((r) => r[4])).toEqual(["Status", "Amount"]);
    expect(preview.rows[0]).toEqual([
      "Commitment accepted",
      "2026-02-01T12:30:00.000Z",
      expect.any(String),
      "Capital markets desk",
      "Status",
      "Pending",
      "Accepted",
    ]);
  });

  it("falls back to em dashes for missing before/after values", () => {
    const rows = historyDiffRowCells({
      ...events[1]!,
      changes: [{ field: "Desk note", from: null, to: null }],
    } as unknown as RaiseHistoryEvent);
    expect(rows[0]!.slice(5)).toEqual(["—", "—"]);
  });

  it("labels the export mode and change count in the CSV meta block", () => {
    const lines = buildRaiseHistoryCsv(base).split("\r\n");
    expect(lines).toContain("Export mode,Changed fields only");
    expect(lines).toContain("Changes,2");
    expect(lines).toContain(RAISE_HISTORY_DIFF_COLUMNS.join(","));
  });

  it("keeps the full export shape when diffOnly is off", () => {
    const preview = buildRaiseHistoryExportPreview({ ...base, diffOnly: false });
    expect(preview.rowCount).toBe(2);
    expect(preview.columns[0]).toBe("Stage");
    expect(preview.columns).toContain("Change summary");
    expect(preview.csvFileName).not.toContain("diff-only");
  });

  it("marks diff-only downloads in the file names", () => {
    expect(
      raiseHistoryCsvFileName({
        roundName: "Series C — Robotics",
        generatedAt: "2026-03-01T10:00:00.000Z",
        diffOnly: true,
      }),
    ).toBe("gf3x-series-c-robotics-status-history-diff-only-2026-03-01.csv");
    expect(buildRaiseHistoryReportHtml(base).fileName).toContain("-diff-only-");
  });

  it("renders a before/after table in the printable diff statement", () => {
    const html = buildRaiseHistoryReportHtml(base).html;
    expect(html).toContain("Export mode: Changed fields only");
    expect(html).toContain("Before &rarr; After");
    expect(html).toContain("Accepted");
    expect(html).not.toContain("Round opened");
  });
});

describe("include/exclude diff columns", () => {
  const base = {
    events,
    roundName: "Series C — Robotics",
    currency: "USD",
    investorName: "Ada Investor",
    generatedAt: "2026-03-01T10:00:00.000Z",
  };

  it("drops the diff columns from the full export when excluded", () => {
    const columns = exportColumns({ ...base, includeDiff: false });
    expect(columns).not.toContain("Changed fields");
    expect(columns).not.toContain("Before");
    expect(columns).not.toContain("After");
    expect(columns).not.toContain("Change summary");
    expect(columns).toContain("Reference");
    const rows = exportRows({ ...base, includeDiff: false });
    expect(rows[0]!).toHaveLength(columns.length);
  });

  it("keeps the diff columns by default", () => {
    expect(exportColumns(base)).toContain("Change summary");
  });

  it("records the toggle in metadata and file names", () => {
    const preview = buildRaiseHistoryExportPreview({ ...base, includeDiff: false });
    expect(preview.meta.find((m) => m.label === "Diff columns")!.value).toBe("Excluded");
    expect(preview.csvFileName).toContain("-no-diff");
    expect(preview.pdfFileName).toContain("-no-diff");
    expect(buildRaiseHistoryCsv({ ...base, includeDiff: false })).toContain(
      "Diff columns,Excluded",
    );
  });

  it("omits the inline diff visuals from the printable statement when excluded", () => {
    const withDiff = buildRaiseHistoryReportHtml(base).html;
    const withoutDiff = buildRaiseHistoryReportHtml({ ...base, includeDiff: false }).html;
    expect(withDiff).toContain('<ul class="diff">');
    expect(withoutDiff).not.toContain('<ul class="diff">');
  });
});
