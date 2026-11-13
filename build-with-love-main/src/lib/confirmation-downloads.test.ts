import { describe, expect, it } from "vitest";
import {
  downloadSourceLabel,
  downloadSummary,
  groupDownloadsByRound,
  normalizeDownloadSource,
  totalDocumentsDownloaded,
  type ConfirmationDownloadRow,
} from "@/lib/confirmation-downloads";

function row(over: Partial<ConfirmationDownloadRow> = {}): ConfirmationDownloadRow {
  return {
    id: "1",
    round_id: "r1",
    round_name: "Series C",
    event_key: "accepted",
    document_title: "Capital Raising Notice",
    reference: "REF-1",
    source: "portal",
    document_count: 1,
    created_at: "2026-05-01T10:00:00.000Z",
    ...over,
  };
}

describe("confirmation download audit trail", () => {
  it("labels and normalises sources", () => {
    expect(downloadSourceLabel("bulk")).toBe("Bulk archive");
    expect(downloadSourceLabel("email_link")).toBe("Secure email link");
    expect(normalizeDownloadSource("nonsense")).toBe("portal");
  });

  it("summarises bundles with a document count", () => {
    expect(downloadSummary(row())).toBe("Capital Raising Notice");
    expect(downloadSummary(row({ document_count: 3 }))).toBe("Capital Raising Notice (3 documents)");
  });

  it("totals documents across rows", () => {
    expect(totalDocumentsDownloaded([row(), row({ id: "2", document_count: 4 })])).toBe(5);
  });

  it("groups rows by round and keeps recency order", () => {
    const groups = groupDownloadsByRound([
      row({ id: "1", round_id: "r2", round_name: "Series D" }),
      row({ id: "2" }),
      row({ id: "3" }),
      row({ id: "4", round_id: null, round_name: "Legacy round" }),
    ]);
    expect(groups.map((g) => g.roundName)).toEqual(["Series D", "Series C", "Legacy round"]);
    expect(groups[1]!.rows).toHaveLength(2);
  });
});
