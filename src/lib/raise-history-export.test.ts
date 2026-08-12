import { describe, expect, it } from "vitest";
import type { RaiseHistoryEvent } from "./raise-history";
import {
  buildRaiseHistoryExportPreview,
  buildRaiseHistoryCsv,
  buildRaiseHistoryReportHtml,
  csvCell,
  formatHistoryStamp,
  raiseHistoryCsvFileName,
} from "./raise-history-export";

const events: RaiseHistoryEvent[] = [
  {
    key: "round-open",
    at: "2026-01-05T09:00:00.000Z",
    label: "Round opened",
    detail: "The desk opened the round.",
    actor: "Capital markets desk",
    tone: "progress",
  },
  {
    key: "commitment-accepted",
    at: "2026-02-10T14:30:00.000Z",
    label: "Commitment accepted",
    detail: 'Accepted, "fully" funded',
    actor: "Capital markets desk",
    tone: "success",
    amount: 250000,
    note: "Allocation confirmed",
    reference: "cmt-1",
  },
  {
    key: "round-funded",
    at: null,
    label: "Round fully funded",
    detail: "Target reached.",
    actor: "System",
    tone: "success",
  },
];

const input = {
  events,
  roundName: "Series C — Robotics",
  currency: "USD",
  investorName: "Ada Investor",
  generatedAt: "2026-03-01T10:00:00.000Z",
};

describe("csvCell", () => {
  it("quotes separators, quotes and newlines", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell(null)).toBe("");
  });
});

describe("formatHistoryStamp", () => {
  it("falls back for missing or invalid dates", () => {
    expect(formatHistoryStamp(null)).toBe("Not recorded");
    expect(formatHistoryStamp("not-a-date")).toBe("Not recorded");
  });

  it("renders a UTC stamp", () => {
    const out = formatHistoryStamp("2026-02-10T14:30:00.000Z");
    expect(out).toContain("2026");
    expect(out).toContain("UTC");
  });
});

describe("buildRaiseHistoryCsv", () => {
  const csv = buildRaiseHistoryCsv(input);
  const lines = csv.split("\r\n");

  it("includes a metadata preamble", () => {
    expect(lines[0]).toBe("Round,Series C — Robotics");
    expect(lines[1]).toBe("Investor,Ada Investor");
    expect(lines[2]).toBe("Generated,2026-03-01T10:00:00.000Z");
    expect(lines[3]).toBe("Date range,All dates");
    expect(lines[4]).toBe("Event types,All event types");
    expect(lines[5]).toBe("Changed fields,All changed fields");
    expect(lines[6]).toBe("Export mode,Full history");
    expect(lines[7]).toBe("Diff columns,Included");
    expect(lines[8]).toBe("Events,3");
  });

  it("writes one row per event with ISO and readable timestamps", () => {
    const header = lines[10]!.split(",");
    expect(header[0]).toBe("Stage");
    expect(header[1]).toBe("Timestamp (ISO 8601)");
    expect(lines).toHaveLength(11 + events.length);
    expect(lines[11]).toContain("2026-01-05T09:00:00.000Z");
    expect(lines[13]).toContain("Not recorded");
  });

  it("keeps actor labels and amounts with currency", () => {
    expect(lines[12]).toContain("Capital markets desk");
    expect(lines[12]).toContain("250000,USD");
    expect(lines[13]).toContain("System");
  });

  it("escapes quotes and commas in detail copy", () => {
    expect(lines[12]).toContain('"Accepted, ""fully"" funded"');
  });

  it("leaves currency blank when no amount was involved", () => {
    expect(lines[11]).not.toContain("USD");
  });
});

describe("raiseHistoryCsvFileName", () => {
  it("slugs the round and stamps the date", () => {
    expect(raiseHistoryCsvFileName({ roundName: "Series C — Robotics", generatedAt: input.generatedAt })).toBe(
      "gf3x-series-c-robotics-status-history-2026-03-01.csv",
    );
  });
});

describe("buildRaiseHistoryReportHtml", () => {
  const doc = buildRaiseHistoryReportHtml(input);

  it("names the file and titles the statement", () => {
    expect(doc.fileName).toBe("gf3x-series-c-robotics-status-history-2026-03-01.html");
    expect(doc.title).toBe("Capital Raising — Status History");
  });

  it("renders every stage with actor and amount", () => {
    expect(doc.html).toContain("Round opened");
    expect(doc.html).toContain("Commitment accepted");
    expect(doc.html).toContain("Capital markets desk");
    expect(doc.html).toContain("$250,000");
    expect(doc.html).toContain("Desk note: Allocation confirmed");
  });

  it("escapes untrusted copy", () => {
    const evil = buildRaiseHistoryReportHtml({
      ...input,
      events: [{ ...events[0]!, detail: "<script>alert(1)</script>" }],
    });
    expect(evil.html).not.toContain("<script>alert(1)</script>");
    expect(evil.html).toContain("&lt;script&gt;");
  });

  it("handles an empty history", () => {
    const empty = buildRaiseHistoryReportHtml({ ...input, events: [] });
    expect(empty.html).toContain("No status events recorded yet.");
  });
});

describe("buildRaiseHistoryExportPreview", () => {
  const input = {
    events,
    roundName: "Series C — Robotics",
    currency: "USD",
    investorName: "Ada Investor",
    generatedAt: "2026-03-01T10:00:00.000Z",
  };

  it("lists the same columns as the CSV header", () => {
    const preview = buildRaiseHistoryExportPreview(input);
    const csvHeader = buildRaiseHistoryCsv(input)
      .split("\r\n")
      .find((l) => l.startsWith("Stage"))!;
    expect(preview.columns.join(",")).toBe(csvHeader);
  });

  it("previews one row per exported event with matching cell counts", () => {
    const preview = buildRaiseHistoryExportPreview(input);
    expect(preview.rowCount).toBe(events.length);
    expect(preview.rows).toHaveLength(events.length);
    for (const row of preview.rows) expect(row).toHaveLength(preview.columns.length);
    expect(preview.rows[0]![0]).toBe(events[0]!.label);
  });

  it("surfaces the metadata block and both file names", () => {
    const preview = buildRaiseHistoryExportPreview({
      ...input,
      rangeLabel: "1–31 January 2026",
      rangeSlug: "2026-01-01-2026-01-31",
      filterLabel: "Desk decision",
      filterSlug: "decision",
    });
    expect(preview.meta.map((m) => m.label)).toEqual([
      "Round",
      "Investor",
      "Date range",
      "Event types",
      "Changed fields",
      "Export mode",
      "Diff columns",
      "Currency",
    ]);
    expect(preview.meta[2]!.value).toBe("1–31 January 2026");
    expect(preview.csvFileName).toContain("-decision-");
    expect(preview.csvFileName.endsWith(".csv")).toBe(true);
    expect(preview.pdfFileName.endsWith(".pdf")).toBe(true);
  });

  it("reports an empty export when filters exclude everything", () => {
    const preview = buildRaiseHistoryExportPreview({ ...input, events: [] });
    expect(preview.rowCount).toBe(0);
    expect(preview.rows).toEqual([]);
  });
});
