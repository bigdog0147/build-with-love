import { describe, expect, it } from "vitest";
import {
  change,
  changes,
  formatChange,
  formatChangeSummary,
  formatChangeValue,
} from "./raise-history-diff";
import { raiseHistory } from "./raise-history";
import { buildRaiseHistoryCsv, buildRaiseHistoryReportHtml } from "./raise-history-export";

describe("change value formatting", () => {
  it("falls back to a dash for missing or blank values", () => {
    expect(formatChangeValue(null)).toBe("—");
    expect(formatChangeValue(undefined)).toBe("—");
    expect(formatChangeValue("  ")).toBe("—");
    expect(formatChangeValue(" open ")).toBe("open");
  });

  it("renders a single change as before → after", () => {
    expect(formatChange({ field: "Status", from: "pending", to: "invited" })).toBe(
      "Status: pending → invited",
    );
    expect(formatChange({ field: "Desk note", from: null, to: "Allocated" })).toBe(
      "Desk note: — → Allocated",
    );
  });

  it("joins multiple changes into one summary", () => {
    expect(
      formatChangeSummary([
        { field: "Status", from: "pending", to: "funded" },
        { field: "Amount", from: null, to: "$1,000" },
      ]),
    ).toBe("Status: pending → funded; Amount: — → $1,000");
    expect(formatChangeSummary([])).toBe("");
    expect(formatChangeSummary(undefined)).toBe("");
  });

  it("drops no-op changes", () => {
    expect(change("Status", "open", "open")).toBeNull();
    expect(change("Desk note", null, "  ")).toBeNull();
    expect(change("Status", "open", "closed")).toEqual({
      field: "Status",
      from: "open",
      to: "closed",
    });
    expect(changes(change("Status", "a", "a"), change("Status", "a", "b"))).toHaveLength(1);
  });
});

const events = raiseHistory({
  round: {
    id: "r1",
    name: "Series C",
    status: "closed",
    currency: "USD",
    opens_at: "2026-01-01T00:00:00.000Z",
    closes_at: "2026-03-01T00:00:00.000Z",
  },
  interest: {
    id: "i1",
    status: "invited",
    created_at: "2026-01-10T00:00:00.000Z",
    reviewed_at: "2026-01-15T00:00:00.000Z",
    indicative_amount: 250000,
    review_note: "Allocated full request",
    currency: "USD",
  },
  commitment: {
    id: "c1",
    status: "accepted",
    created_at: "2026-02-01T00:00:00.000Z",
    reviewed_at: "2026-02-05T00:00:00.000Z",
    amount: 250000,
    currency: "USD",
  },
});

describe("history events carry diffs", () => {
  it("records status transitions for every stage", () => {
    const byKey = Object.fromEntries(events.map((e) => [e.key, e]));
    expect(formatChangeSummary(byKey["round-open"].changes)).toBe("Round status: draft → open");
    expect(formatChangeSummary(byKey["interest-invited"].changes)).toBe(
      "Indication status: pending → invited; Desk note: — → Allocated full request",
    );
    expect(formatChangeSummary(byKey["commitment-accepted"].changes)).toBe(
      "Commitment status: pending → accepted",
    );
    expect(formatChangeSummary(byKey["round-closed"].changes)).toBe(
      "Round status: open → closed",
    );
  });
});

describe("exports include the diff", () => {
  const input = {
    events,
    roundName: "Series C",
    currency: "USD",
    investorName: "Ada Lovelace",
    generatedAt: "2026-03-02T00:00:00.000Z",
  };

  it("adds diff columns to the CSV", () => {
    const csv = buildRaiseHistoryCsv(input);
    const header = csv.split("\r\n").find((l) => l.startsWith("Stage"))!;
    expect(header).toContain("Changed fields");
    expect(header).toContain("Before");
    expect(header).toContain("After");
    expect(header).toContain("Change summary");
    expect(csv).toContain("Indication status: pending → invited");
    expect(csv).toContain("Round status: draft → open");
  });

  it("renders before/after rows in the printable statement", () => {
    const { html } = buildRaiseHistoryReportHtml(input);
    expect(html).toContain('class="diff"');
    expect(html).toContain("Indication status");
    expect(html).toContain("&rarr;");
    expect(html).toContain("closed");
  });
});
