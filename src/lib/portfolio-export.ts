/**
 * Investor record-keeping exports.
 *
 * Pure builders for the performance/allocation CSV and the printable PDF
 * report, plus thin browser helpers. Keeping the string building pure means
 * the export can be asserted in tests without a DOM.
 */

import type {
  AllocationDimension,
  AllocationSlice,
  ComparisonPoint,
  SeriesPoint,
} from "./portfolio-series";

export type PortfolioExportInput = {
  points: (SeriesPoint | ComparisonPoint)[];
  slices: AllocationSlice[];
  dimension: AllocationDimension;
  range: string;
  /** Label of the active comparison line, if any. */
  comparisonLabel?: string;
  currency?: string;
  investorName?: string;
  generatedAt?: string;
};

const DIMENSION_LABEL: Record<AllocationDimension, string> = {
  sector: "Sector",
  category: "Category",
  project: "Project",
};

const n2 = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");

/** RFC 4180 quoting: wrap when the field carries a comma, quote or newline. */
export function csvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

const row = (cells: (string | number | null | undefined)[]) => cells.map(csvCell).join(",");

function compareOf(point: SeriesPoint | ComparisonPoint): number | null {
  return "compare" in point ? point.compare : null;
}

/** Single CSV carrying the performance series and the allocation breakdown. */
export function buildPortfolioCsv(input: PortfolioExportInput): string {
  const currency = input.currency ?? "USD";
  const dimLabel = DIMENSION_LABEL[input.dimension];
  const hasCompare = Boolean(input.comparisonLabel);
  const lines: string[] = [];

  lines.push(row(["Gigafactory 3X — Portfolio export"]));
  lines.push(row(["Generated", input.generatedAt ?? new Date().toISOString()]));
  if (input.investorName) lines.push(row(["Investor", input.investorName]));
  lines.push(row(["Range", input.range]));
  lines.push(row(["Currency", currency]));
  lines.push(row(["Allocation breakdown", dimLabel]));
  lines.push("");

  lines.push(row(["Performance"]));
  lines.push(
    row([
      "Date",
      "Portfolio value",
      "Income received",
      "Value + income",
      "Invested",
      ...(hasCompare ? [input.comparisonLabel!] : []),
    ]),
  );
  for (const p of input.points) {
    const compare = compareOf(p);
    lines.push(
      row([
        p.date,
        n2(p.value),
        n2(p.income),
        n2(p.total),
        n2(p.invested),
        ...(hasCompare ? [compare === null ? "" : n2(compare)] : []),
      ]),
    );
  }
  lines.push("");

  lines.push(row([`Allocation by ${dimLabel.toLowerCase()}`]));
  lines.push(row([dimLabel, "Current value", "Share %", "Invested", "Gain", "Gain %"]));
  for (const s of input.slices) {
    lines.push(row([s.label, n2(s.value), n2(s.percent), n2(s.invested), n2(s.gain), n2(s.gainPct)]));
  }
  lines.push("");

  lines.push(row(["Holdings"]));
  lines.push(
    row([dimLabel, "Project", "Sector", "Category", "Invested", "Current value", "Gain", "Gain %", "Share of slice %"]),
  );
  for (const s of input.slices) {
    for (const h of s.holdings) {
      lines.push(
        row([
          s.label,
          h.project,
          h.sector,
          h.category,
          n2(h.invested),
          n2(h.value),
          n2(h.gain),
          n2(h.gainPct),
          n2(h.shareOfSlice),
        ]),
      );
    }
  }

  return lines.join("\r\n");
}

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function fmtMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${n2(value)}`;
  }
}

const slug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "export";

export type PortfolioExportDocument = { fileName: string; title: string; html: string };

/** Print-ready report; the browser print dialog turns this into a PDF. */
export function buildPortfolioReportHtml(input: PortfolioExportInput): PortfolioExportDocument {
  const currency = input.currency ?? "USD";
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const dimLabel = DIMENSION_LABEL[input.dimension];
  const money = (v: number) => fmtMoney(v, currency);
  const first = input.points[0];
  const last = input.points[input.points.length - 1];
  const openTotal = first?.total ?? 0;
  const closeTotal = last?.total ?? 0;
  const change = closeTotal - openTotal;
  const changePct = openTotal > 0 ? (change / openTotal) * 100 : 0;
  const compareClose = last ? compareOf(last) : null;
  const totalValue = input.slices.reduce((sum, s) => sum + s.value, 0);
  const totalInvested = input.slices.reduce((sum, s) => sum + s.invested, 0);

  const summary: [string, string][] = [
    ["Investor", input.investorName || "Investor"],
    ["Window", input.range === "ALL" ? "All time" : input.range],
    ["Opening value + income", money(openTotal)],
    ["Closing value + income", money(closeTotal)],
    [
      "Change over window",
      `${change >= 0 ? "+" : ""}${money(change)} (${changePct >= 0 ? "+" : ""}${n2(changePct)}%)`,
    ],
    ["Invested capital", money(totalInvested)],
    ["Current holdings value", money(totalValue)],
  ];
  if (input.comparisonLabel && compareClose !== null) {
    summary.push([
      `Compared with ${input.comparisonLabel}`,
      `${money(compareClose)} · ${closeTotal - compareClose >= 0 ? "+" : ""}${money(closeTotal - compareClose)}`,
    ]);
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Portfolio Report — Gigafactory 3X</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 40px 28px; background: #0b0b0c; color: #f5f4f1;
         font-family: "Helvetica Neue", Arial, sans-serif; font-size: 13px; line-height: 1.55; }
  .sheet { max-width: 900px; margin: 0 auto; background: #131315; border: 1px solid #2a2a2d;
           border-radius: 16px; padding: 36px; }
  .brand { display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
           flex-wrap: wrap; border-bottom: 1px solid #2a2a2d; padding-bottom: 16px; }
  .brand strong { font-size: 18px; letter-spacing: 0.14em; text-transform: uppercase; color: #d4af62; }
  .brand span { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a8a90; }
  h1 { font-size: 21px; margin: 24px 0 4px; }
  h2 { font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #8a8a90;
       margin: 30px 0 10px; font-weight: 400; }
  .lede { color: #b6b5b1; margin: 0 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: right; padding: 8px 6px; border-bottom: 1px solid #232326; }
  th { font-weight: 400; color: #8a8a90; font-size: 11px; text-transform: uppercase;
       letter-spacing: 0.1em; }
  th:first-child, td:first-child { text-align: left; }
  .kv th { width: 42%; text-align: left; }
  .kv td { text-align: left; }
  footer { border-top: 1px solid #2a2a2d; margin-top: 28px; padding-top: 16px;
           color: #7e7e84; font-size: 11px; }
  @media print {
    body { background: #ffffff; color: #111111; padding: 0; }
    .sheet { border: none; background: #ffffff; border-radius: 0; padding: 0; }
    .brand strong { color: #8a6d24; }
    th, td, .brand, footer { border-color: #dddddd; }
    .lede, th, footer, .brand span { color: #555555; }
    h2 { color: #666666; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <main class="sheet">
    <div class="brand">
      <strong>Gigafactory 3X</strong>
      <span>Investor Reporting</span>
    </div>
    <h1>Portfolio Report</h1>
    <p class="lede">Performance and allocation snapshot for your records. Amounts in ${escape(currency)}.</p>

    <h2>Summary</h2>
    <table class="kv"><tbody>
      ${summary
        .map(([k, v]) => `<tr><th>${escape(k)}</th><td>${escape(v)}</td></tr>`)
        .join("\n      ")}
    </tbody></table>

    <h2>Allocation by ${escape(dimLabel.toLowerCase())}</h2>
    <table>
      <thead><tr><th>${escape(dimLabel)}</th><th>Current value</th><th>Share</th><th>Invested</th><th>Gain</th><th>Gain %</th></tr></thead>
      <tbody>
        ${
          input.slices.length
            ? input.slices
                .map(
                  (s) =>
                    `<tr><td>${escape(s.label)}</td><td>${escape(money(s.value))}</td><td>${n2(s.percent)}%</td><td>${escape(
                      money(s.invested),
                    )}</td><td>${s.gain >= 0 ? "+" : ""}${escape(money(s.gain))}</td><td>${
                      s.gainPct >= 0 ? "+" : ""
                    }${n2(s.gainPct)}%</td></tr>`,
                )
                .join("\n        ")
            : `<tr><td colspan="6">No holdings recorded.</td></tr>`
        }
      </tbody>
    </table>

    <h2>Performance series</h2>
    <table>
      <thead><tr><th>Date</th><th>Value</th><th>Income</th><th>Value + income</th><th>Invested</th>${
        input.comparisonLabel ? `<th>${escape(input.comparisonLabel)}</th>` : ""
      }</tr></thead>
      <tbody>
        ${
          input.points.length
            ? input.points
                .map((p) => {
                  const compare = compareOf(p);
                  return `<tr><td>${escape(p.date)}</td><td>${escape(money(p.value))}</td><td>${escape(
                    money(p.income),
                  )}</td><td>${escape(money(p.total))}</td><td>${escape(money(p.invested))}</td>${
                    input.comparisonLabel
                      ? `<td>${compare === null ? "—" : escape(money(compare))}</td>`
                      : ""
                  }</tr>`;
                })
                .join("\n        ")
            : `<tr><td colspan="6">No valuations recorded for this window.</td></tr>`
        }
      </tbody>
    </table>

    <footer>
      Generated ${escape(generatedAt)} from your Gigafactory 3X investor portal. Values are indicative
      and restate records already held in your account; this report is not an offer or a solicitation
      to invest.
    </footer>
  </main>
</body>
</html>`;

  return {
    fileName: `gf3x-portfolio-${slug(input.range)}-${generatedAt.slice(0, 10)}.html`,
    title: "Portfolio Report",
    html,
  };
}

export function portfolioCsvFileName(input: { range: string; generatedAt?: string }) {
  const stamp = (input.generatedAt ?? new Date().toISOString()).slice(0, 10);
  return `gf3x-portfolio-${slug(input.range)}-${stamp}.csv`;
}

/** Triggers a browser download for text content; no-ops on the server. */
export function downloadTextFile(fileName: string, content: string, mimeType: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Opens the printable report so the browser's print dialog can save it as PDF.
 * Falls back to downloading the document when popups are blocked.
 */
export function printPortfolioReport(doc: PortfolioExportDocument) {
  if (typeof window === "undefined") return;
  const win = window.open("", "_blank", "noopener,noreferrer,width=980,height=1200");
  if (!win) {
    downloadTextFile(doc.fileName, doc.html, "text/html");
    return;
  }
  win.document.open();
  win.document.write(doc.html);
  win.document.close();
  win.focus();
  // Let styles settle before the dialog snapshots the page.
  win.setTimeout(() => win.print(), 350);
}
