/**
 * Single-transition diff statement.
 *
 * The timeline already exports the whole status history as CSV/PDF. This module
 * renders ONE status transition as its own branded PDF statement, listing the
 * before/after values of every field that moved at that stage, so an investor
 * can file or forward a single change without sending the full history.
 */

import type { RaiseHistoryEvent } from "./raise-history";
import { PDF_LAYOUT, PdfDocument } from "./pdf-document";
import { formatChangeValue } from "./raise-history-diff";
import { formatHistoryStamp } from "./raise-history-export";

export interface RaiseTransitionStatementInput {
  event: RaiseHistoryEvent;
  roundName: string;
  currency: string;
  investorName: string;
  generatedAt?: string;
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "round";

function formatMoney(amount: number | null | undefined, currency: string) {
  if (amount === null || amount === undefined) return "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export const RAISE_TRANSITION_STATEMENT_TITLE = "Status Change Statement";

/** File name for one transition's diff statement. */
export function raiseTransitionStatementFileName(input: RaiseTransitionStatementInput) {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const datePart = (input.event.at ?? generatedAt).slice(0, 10);
  return `gf3x-${slug(input.roundName)}-${slug(input.event.label)}-change-statement-${datePart}.pdf`;
}

/** Renders the diff statement for a single status transition as PDF bytes. */
export function buildRaiseTransitionStatementPdf(input: RaiseTransitionStatementInput): {
  fileName: string;
  title: string;
  bytes: Uint8Array;
} {
  const { event } = input;
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const title = RAISE_TRANSITION_STATEMENT_TITLE;

  const pdf = new PdfDocument(`${title} — ${event.label}`);
  const gold: [number, number, number] = [0.66, 0.53, 0.24];
  const grey: [number, number, number] = [0.42, 0.42, 0.45];

  pdf.rect(PDF_LAYOUT.MARGIN, 40, PDF_LAYOUT.CONTENT_WIDTH, 2.5, gold);
  pdf.space(22);
  pdf.text("GIGAFACTORY 3X", { font: "bold", size: 15, color: gold, spaceAfter: 2 });
  pdf.text("Capital Markets Desk", { size: 9, color: grey, spaceAfter: 14 });
  pdf.rule([0.88, 0.88, 0.89]);
  pdf.space(12);

  pdf.text(title, { font: "bold", size: 19, spaceAfter: 6 });
  pdf.text(event.detail, { size: 11, color: [0.25, 0.25, 0.28], spaceAfter: 18 });

  const rows: [string, string][] = [
    ["Investor", input.investorName || "Investor"],
    ["Round", input.roundName],
    ["Stage", event.label],
    ["Recorded by", event.actor],
    ["Timestamp (UTC)", formatHistoryStamp(event.at)],
  ];
  const amount = formatMoney(event.amount ?? null, input.currency);
  if (amount) rows.splice(3, 0, ["Amount", amount]);
  if (event.reference) rows.push(["Reference", event.reference]);
  for (const [label, value] of rows) pdf.row(label, value);

  pdf.space(18);
  pdf.text("Changes at this transition", { font: "bold", size: 12, spaceAfter: 8 });

  const changes = event.changes ?? [];
  if (changes.length === 0) {
    pdf.text("No field-level changes were recorded for this stage.", { size: 10.5, color: grey });
  } else {
    for (const change of changes) {
      pdf.row(
        change.field,
        `${formatChangeValue(change.from)}  \u2192  ${formatChangeValue(change.to)}`,
      );
    }
  }

  if (event.note) {
    pdf.space(16);
    const noteTop = pdf.y;
    pdf.text(`Desk note: ${event.note}`, { size: 10.5, indent: 14, spaceAfter: 6 });
    pdf.rect(PDF_LAYOUT.MARGIN, noteTop, 2, Math.max(14, pdf.y - noteTop - 6), gold);
  }

  pdf.space(20);
  pdf.rule([0.88, 0.88, 0.89]);
  pdf.space(8);
  pdf.text(
    `Generated ${formatHistoryStamp(generatedAt)} from your capital raising portal. This statement ` +
      "restates one status change already recorded in your account; it is a history record, not an " +
      "offer or a solicitation to invest.",
    { size: 8.5, color: grey },
  );

  return { fileName: raiseTransitionStatementFileName(input), title, bytes: pdf.toBytes() };
}

/** Triggers a browser download of one transition's diff statement; no-ops on the server. */
export function downloadRaiseTransitionStatement(input: RaiseTransitionStatementInput) {
  if (typeof document === "undefined") return null;
  const { fileName, bytes } = buildRaiseTransitionStatementPdf(input);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return fileName;
}
