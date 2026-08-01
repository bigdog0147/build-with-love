import { describe, expect, it } from "vitest";
import {
  buildLedgerCsv,
  csvCell,
  ledgerCsvFilename,
  LEDGER_CSV_HEADERS,
} from "./transactions-csv";

const row = {
  id: "t1",
  name: "Deposit · Bank transfer",
  kind: "Deposit",
  amount: 1500,
  currency: "USD",
  status: "Cleared",
  occurred_at: "2026-02-01T10:00:00.000Z",
};

describe("csvCell", () => {
  it("returns empty string for null/undefined", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("leaves plain values untouched", () => {
    expect(csvCell("Cleared")).toBe("Cleared");
  });

  it("quotes values containing commas, quotes or newlines", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralises formula injection", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell("@x")).toBe("'@x");
  });
});

describe("buildLedgerCsv", () => {
  it("emits only headers for an empty set", () => {
    expect(buildLedgerCsv([])).toBe(LEDGER_CSV_HEADERS.join(","));
  });

  it("writes one CRLF-separated line per row with 2dp amounts", () => {
    const csv = buildLedgerCsv([row, { ...row, id: "t2", amount: -25.5 }]);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("1500.00");
    expect(lines[2]).toContain("-25.50");
  });

  it("keeps descriptions with commas in a single column", () => {
    const csv = buildLedgerCsv([{ ...row, name: "Transfer to Smith, John" }]);
    expect(csv).toContain('"Transfer to Smith, John"');
  });
});

describe("ledgerCsvFilename", () => {
  it("stamps the date", () => {
    expect(ledgerCsvFilename(new Date("2026-03-04T12:00:00Z"))).toBe(
      "gf3x-transactions-2026-03-04.csv",
    );
  });
});
