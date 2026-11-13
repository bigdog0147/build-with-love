import { describe, expect, it } from "vitest";
import {
  buildRaiseConfirmation,
  buildRaiseConfirmationPdf,
  raiseConfirmationTitle,
} from "./raise-confirmation";

const base = {
  kind: "commitment-accepted",
  reference: "cmt-1",
  roundName: "Series C — Cell Plant",
  currency: "USD",
  investorName: "Ada Lovelace",
  amount: 250000,
  decidedAt: "2026-03-04T10:00:00.000Z",
  actor: "Capital markets desk",
  headline: "Commitment accepted",
  detail: "The desk accepted your funded commitment and deployed the capital.",
  generatedAt: "2026-03-05T09:00:00.000Z",
};

describe("raise confirmation documents", () => {
  it("titles each decision kind", () => {
    expect(raiseConfirmationTitle("commitment-accepted")).toBe("Acceptance Confirmation");
    expect(raiseConfirmationTitle("commitment-funded")).toBe("Funding Confirmation");
    expect(raiseConfirmationTitle("commitment-released")).toBe("Release Confirmation");
    expect(raiseConfirmationTitle("unknown-event")).toBe("Capital Raising Notice");
  });

  it("includes investor, round, amount and reference", () => {
    const doc = buildRaiseConfirmation(base);
    expect(doc.html).toContain("Ada Lovelace");
    expect(doc.html).toContain("Series C — Cell Plant");
    expect(doc.html).toContain("cmt-1");
    expect(doc.html).toMatch(/\$250,000/);
    expect(doc.title).toBe("Acceptance Confirmation");
  });

  it("builds a dated, slugged file name", () => {
    expect(buildRaiseConfirmation(base).fileName).toBe(
      "gf3x-series-c-cell-plant-acceptance-confirmation-2026-03-04.pdf",
    );
  });

  it("omits the amount row when no money is involved", () => {
    const doc = buildRaiseConfirmation({ ...base, kind: "round-closed", amount: null });
    expect(doc.html).not.toContain("<th>Amount</th>");
  });

  it("escapes desk notes and names", () => {
    const doc = buildRaiseConfirmation({ ...base, note: '<script>alert("x")</script>' });
    expect(doc.html).not.toContain("<script>");
    expect(doc.html).toContain("&lt;script&gt;");
  });


  it("renders a real PDF file", () => {
    const pdf = buildRaiseConfirmationPdf(base);
    const text = new TextDecoder("latin1").decode(pdf.bytes);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(text).toContain("startxref");
    expect(text).toContain("Ada Lovelace");
    expect(text).toContain("cmt-1");
    expect(pdf.fileName.endsWith(".pdf")).toBe(true);
    expect(pdf.bytes.byteLength).toBeGreaterThan(1000);
  });

  it("keeps money and unsupported glyphs printable", () => {
    const pdf = buildRaiseConfirmationPdf({ ...base, currency: "EUR", roundName: "Série C" });
    const text = new TextDecoder("latin1").decode(pdf.bytes);
    expect(text).toContain("EUR");
    expect(text).not.toMatch(/[^\x00-\x7f]/);
  });
});
