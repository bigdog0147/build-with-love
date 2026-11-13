import { describe, expect, it } from "vitest";
import type { RaiseHistoryEvent } from "./raise-history";
import {
  filterRaiseHistoryByFields,
  hasRaiseFieldFilter,
  raiseHistoryFieldCounts,
  raiseHistoryFieldLabel,
  raiseHistoryFieldSlug,
  raiseHistoryFields,
} from "./raise-history-fields";

const event = (key: string, changes: { field: string; from: string | null; to: string | null }[]) =>
  ({
    key,
    label: key,
    detail: "",
    actor: "Desk",
    tone: "progress",
    at: "2026-03-04T10:00:00.000Z",
    amount: null,
    note: null,
    reference: null,
    changes,
  }) as unknown as RaiseHistoryEvent;

const events = [
  event("a", [{ field: "Status", from: "draft", to: "open" }]),
  event("b", [
    { field: "Amount", from: null, to: "250000" },
    { field: "status", from: "open", to: "funded" },
  ]),
  event("c", []),
];

describe("changed-field filter", () => {
  it("lists distinct field labels alphabetically, case-insensitively deduped", () => {
    expect(raiseHistoryFields(events)).toEqual(["Amount", "Status"]);
  });

  it("counts events per field once even with duplicate changes", () => {
    expect(raiseHistoryFieldCounts(events)).toEqual({ status: 2, amount: 1 });
  });

  it("returns every event when no fields are selected", () => {
    expect(filterRaiseHistoryByFields(events, [])).toHaveLength(3);
    expect(hasRaiseFieldFilter([])).toBe(false);
  });

  it("keeps only events where a selected field changed", () => {
    expect(filterRaiseHistoryByFields(events, ["Amount"]).map((e) => e.key)).toEqual(["b"]);
    expect(filterRaiseHistoryByFields(events, ["Status"]).map((e) => e.key)).toEqual(["a", "b"]);
  });

  it("matches field names regardless of case", () => {
    expect(filterRaiseHistoryByFields(events, ["status"]).map((e) => e.key)).toEqual(["a", "b"]);
  });

  it("labels and slugs the active selection for exports", () => {
    expect(raiseHistoryFieldLabel(["Status", "Amount"])).toBe("Amount, Status");
    expect(raiseHistoryFieldLabel([])).toBe("All changed fields");
    expect(raiseHistoryFieldSlug(["Status", "Desk note"])).toBe("fields-desk-note-status");
    expect(raiseHistoryFieldSlug([])).toBeNull();
  });
});
