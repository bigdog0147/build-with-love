import { describe, expect, it } from "vitest";
import type { RaiseHistoryEvent } from "./raise-history";
import {
  buildRaiseTransitionStatementPdf,
  raiseTransitionStatementFileName,
} from "./raise-history-statement";

const event: RaiseHistoryEvent = {
  key: "commitment-accepted",
  label: "Commitment accepted",
  detail: "The desk accepted your commitment.",
  actor: "Capital markets desk",
  tone: "success",
  at: "2026-03-04T10:00:00.000Z",
  amount: 250000,
  note: "Allocation confirmed.",
  reference: "CMT-8891",
  downloadable: true,
  changes: [
    { field: "Status", from: "funded", to: "accepted" },
    { field: "Amount", from: null, to: "250000" },
  ],
} as RaiseHistoryEvent;

const input = {
  event,
  roundName: "Series C",
  currency: "USD",
  investorName: "Ada Lovelace",
  generatedAt: "2026-03-05T09:00:00.000Z",
};

describe("raise transition diff statement", () => {
  it("names the file from the round, stage and transition date", () => {
    expect(raiseTransitionStatementFileName(input)).toBe(
      "gf3x-series-c-commitment-accepted-change-statement-2026-03-04.pdf",
    );
  });

  it("falls back to the generated date when the event has no timestamp", () => {
    expect(raiseTransitionStatementFileName({ ...input, event: { ...event, at: null } })).toContain(
      "2026-03-05",
    );
  });

  it("produces PDF bytes containing the diff values", () => {
    const doc = buildRaiseTransitionStatementPdf(input);
    const text = new TextDecoder("latin1").decode(doc.bytes);
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(doc.title).toBe("Status Change Statement");
    expect(text).toContain("STATUS");
    expect(text).toContain("funded");
    expect(text).toContain("accepted");
    expect(text).toContain("Allocation confirmed");
  });

  it("states when no field-level changes were recorded", () => {
    const doc = buildRaiseTransitionStatementPdf({
      ...input,
      event: { ...event, changes: [] },
    });
    const text = new TextDecoder("latin1").decode(doc.bytes);
    expect(text).toContain("No field-level changes");
  });
});
