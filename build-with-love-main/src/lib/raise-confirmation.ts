/**
 * Pure builder for investor-facing decision confirmation documents.
 *
 * Every decision the desk or the investor makes on a capital raising round is
 * also emailed. This module renders the same content as a self-contained,
 * printable document so investors can download and file each decision —
 * acceptance, funding, release, invitation or a round status change — without
 * any server-side document generation.
 */

import { PDF_LAYOUT, PdfDocument } from "./pdf-document";

export type RaiseConfirmationKind =
  | "interest-submitted"
  | "interest-invited"
  | "interest-declined"
  | "interest-withdrawn"
  | "commitment-created"
  | "commitment-funded"
  | "commitment-accepted"
  | "commitment-released"
  | "commitment-cancelled"
  | "round-open"
  | "round-closed"
  | "round-funded"
  | "round-draft";

export interface RaiseConfirmationInput {
  /** History event key, e.g. "commitment-accepted". */
  kind: string;
  reference: string;
  roundName: string;
  currency: string;
  investorName: string;
  amount?: number | string | null;
  decidedAt?: string | null;
  actor: string;
  headline: string;
  detail: string;
  note?: string | null;
  generatedAt?: string;
}

export interface RaiseConfirmationDocument {
  /** PDF file name, e.g. gf3x-series-c-acceptance-confirmation-2026-03-04.pdf */
  fileName: string;
  title: string;
  /** Print-ready HTML rendering, kept for on-screen preview. */
  html: string;
}

const TITLES: Record<string, string> = {
  "interest-submitted": "Indication of Interest — Acknowledgement",
  "interest-invited": "Invitation to Commit",
  "interest-declined": "Indication of Interest — Outcome",
  "interest-withdrawn": "Indication of Interest — Withdrawal",
  "commitment-created": "Commitment Confirmation",
  "commitment-funded": "Funding Confirmation",
  "commitment-accepted": "Acceptance Confirmation",
  "commitment-released": "Release Confirmation",
  "commitment-cancelled": "Cancellation Confirmation",
  "round-open": "Round Opening Notice",
  "round-closed": "Round Closing Notice",
  "round-funded": "Round Funding Notice",
  "round-draft": "Round Status Notice",
};

const escape = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "round";

function formatMoney(amount: unknown, currency: string) {
  const n = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toLocaleString()} ${currency}`;
  }
}

function formatStamp(at: string | null | undefined) {
  if (!at) return "Not recorded";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "Not recorded";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

/** Confirmation document title for a history event key. */
export function raiseConfirmationTitle(kind: string) {
  return TITLES[kind] ?? "Capital Raising Notice";
}

/** Builds the printable confirmation document for one decision event. */
export function buildRaiseConfirmation(
  input: RaiseConfirmationInput,
): RaiseConfirmationDocument {
  const title = raiseConfirmationTitle(input.kind);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const hasAmount = input.amount !== undefined && input.amount !== null && input.amount !== "";

  const rows: [string, string][] = [
    ["Investor", input.investorName || "Investor"],
    ["Round", input.roundName],
    ["Decision", input.headline],
    ["Recorded by", input.actor],
    ["Decision date", formatStamp(input.decidedAt ?? null)],
    ["Reference", input.reference],
  ];
  if (hasAmount) rows.splice(3, 0, ["Amount", formatMoney(input.amount, input.currency)]);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escape(title)} — ${escape(input.roundName)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 48px 32px; background: #0b0b0c; color: #f5f4f1;
         font-family: "Helvetica Neue", Arial, sans-serif; font-size: 14px; line-height: 1.6; }
  .sheet { max-width: 760px; margin: 0 auto; background: #131315; border: 1px solid #2a2a2d;
           border-radius: 16px; padding: 40px; }
  .brand { display: flex; align-items: baseline; justify-content: space-between;
           border-bottom: 1px solid #2a2a2d; padding-bottom: 18px; gap: 16px; flex-wrap: wrap; }
  .brand strong { font-size: 18px; letter-spacing: 0.14em; text-transform: uppercase; color: #d4af62; }
  .brand span { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a8a90; }
  h1 { font-size: 22px; margin: 28px 0 4px; }
  .lede { color: #b6b5b1; margin: 0 0 26px; }
  table { width: 100%; border-collapse: collapse; margin: 0 0 26px; }
  th, td { text-align: left; padding: 10px 0; border-bottom: 1px solid #232326; vertical-align: top; }
  th { width: 34%; font-weight: 400; color: #8a8a90; font-size: 12px;
       text-transform: uppercase; letter-spacing: 0.12em; }
  .note { border-left: 2px solid #d4af62; padding: 8px 0 8px 14px; color: #d8d7d3; margin: 0 0 26px; }
  footer { border-top: 1px solid #2a2a2d; padding-top: 18px; color: #7e7e84; font-size: 11px; }
  @media print {
    body { background: #ffffff; color: #111111; padding: 0; }
    .sheet { border: none; background: #ffffff; }
    .brand strong { color: #8a6d24; }
    th, td, .brand, footer { border-color: #dddddd; }
    .lede, th, footer { color: #555555; }
    .note { color: #222222; border-color: #8a6d24; }
  }
</style>
</head>
<body>
  <main class="sheet">
    <div class="brand">
      <strong>Gigafactory 3X</strong>
      <span>Capital Markets Desk</span>
    </div>
    <h1>${escape(title)}</h1>
    <p class="lede">${escape(input.detail)}</p>
    <table>
      <tbody>
        ${rows
          .map(([label, value]) => `<tr><th>${escape(label)}</th><td>${escape(value)}</td></tr>`)
          .join("\n        ")}
      </tbody>
    </table>
    ${input.note ? `<p class="note">Desk note: ${escape(input.note)}</p>` : ""}
    <footer>
      Generated ${escape(formatStamp(generatedAt))} from your capital raising portal. This document
      restates a decision already recorded in your account and issued by email; it is a confirmation
      record, not an offer or a solicitation to invest.
    </footer>
  </main>
</body>
</html>`;

  const datePart = (input.decidedAt ?? generatedAt).slice(0, 10);
  return {
    fileName: `gf3x-${slug(input.roundName)}-${slug(title)}-${datePart}.pdf`,
    title,
    html,
  };
}

/**
 * Renders the confirmation as a real PDF file.
 *
 * Built with the dependency-free writer so the identical bytes are produced in
 * the browser (portal download) and in the Worker (signed email link), with no
 * headless browser or print dialog involved.
 */
export function buildRaiseConfirmationPdf(input: RaiseConfirmationInput): {
  fileName: string;
  title: string;
  bytes: Uint8Array;
} {
  const doc = buildRaiseConfirmation(input);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const hasAmount = input.amount !== undefined && input.amount !== null && input.amount !== "";

  const pdf = new PdfDocument(`${doc.title} — ${input.roundName}`);
  const gold: [number, number, number] = [0.66, 0.53, 0.24];
  const grey: [number, number, number] = [0.42, 0.42, 0.45];

  pdf.rect(PDF_LAYOUT.MARGIN, 40, PDF_LAYOUT.CONTENT_WIDTH, 2.5, gold);
  pdf.space(22);
  pdf.text("GIGAFACTORY 3X", { font: "bold", size: 15, color: gold, spaceAfter: 2 });
  pdf.text("Capital Markets Desk", { size: 9, color: grey, spaceAfter: 14 });
  pdf.rule([0.88, 0.88, 0.89]);
  pdf.space(12);

  pdf.text(doc.title, { font: "bold", size: 19, spaceAfter: 6 });
  pdf.text(input.detail, { size: 11, color: [0.25, 0.25, 0.28], spaceAfter: 18 });

  const rows: [string, string][] = [
    ["Investor", input.investorName || "Investor"],
    ["Round", input.roundName],
    ["Decision", input.headline],
    ["Recorded by", input.actor],
    ["Decision date", formatStamp(input.decidedAt ?? null)],
    ["Reference", input.reference],
  ];
  if (hasAmount) rows.splice(3, 0, ["Amount", formatMoney(input.amount, input.currency)]);
  for (const [label, value] of rows) pdf.row(label, value);

  if (input.note) {
    pdf.space(14);
    const noteText = `Desk note: ${input.note}`;
    const noteTop = pdf.y;
    pdf.text(noteText, { size: 10.5, indent: 14, spaceAfter: 6 });
    // Accent bar drawn to the measured height of the wrapped note.
    pdf.rect(PDF_LAYOUT.MARGIN, noteTop, 2, Math.max(14, pdf.y - noteTop - 6), gold);
  }

  pdf.space(20);
  pdf.rule([0.88, 0.88, 0.89]);
  pdf.space(8);
  pdf.text(
    `Generated ${formatStamp(generatedAt)} from your capital raising portal. This document restates a ` +
      "decision already recorded in your account and issued by email; it is a confirmation record, " +
      "not an offer or a solicitation to invest.",
    { size: 8.5, color: grey },
  );

  return { fileName: doc.fileName, title: doc.title, bytes: pdf.toBytes() };
}

/** Triggers a browser download of the confirmation PDF; no-ops on the server. */
export function downloadRaiseConfirmation(input: RaiseConfirmationInput) {
  if (typeof document === "undefined") return;
  const { fileName, bytes } = buildRaiseConfirmationPdf(input);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
