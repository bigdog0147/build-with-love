/** Client-side CSV builder for investor financial reports. */

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map(esc).join(",")).join("\r\n");
}

export function downloadCsv(fileName: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export type StatementInput = {
  investor: { name: string; membership: string };
  range: { from: string; to: string };
  generatedAt: string;
  holdings: {
    id: string;
    product_id: string;
    invested: number | string;
    current_value: number | string;
    units: number | string;
    currency: string;
    status: string;
  }[];
  products: { id: string; name: string; sector: string; currency: string }[];
  valuations: { holding_id: string; product_id: string; as_of: string; unit_price: number | string; value: number | string }[];
  distributions: {
    product_id: string;
    kind: string;
    amount: number | string;
    currency: string;
    paid_at: string;
    note?: string | null;
  }[];
};

/** Positions, valuations and distributions as one flat statement CSV. */
export function statementCsv(input: StatementInput): string {
  const names = new Map(input.products.map((p) => [p.id, p.name]));
  const rows: (string | number)[][] = [
    ["Gigafactory 3X — Portfolio statement"],
    ["Investor", input.investor.name],
    ["Membership", input.investor.membership],
    ["Period", `${input.range.from} to ${input.range.to}`],
    ["Generated", input.generatedAt],
    [],
    ["Positions"],
    ["Project", "Status", "Currency", "Units", "Invested", "Current value", "Gain"],
  ];

  for (const h of input.holdings) {
    const invested = Number(h.invested ?? 0);
    const value = Number(h.current_value ?? 0);
    rows.push([
      names.get(h.product_id) ?? "Project",
      h.status,
      h.currency,
      Number(h.units ?? 0),
      invested,
      value,
      Number((value - invested).toFixed(2)),
    ]);
  }

  rows.push([], ["Valuations in period"], ["Date", "Project", "Unit price", "Value"]);
  for (const v of input.valuations) {
    rows.push([
      String(v.as_of).slice(0, 10),
      names.get(v.product_id) ?? "Project",
      Number(v.unit_price ?? 0),
      Number(v.value ?? 0),
    ]);
  }

  rows.push([], ["Distributions in period"], ["Date", "Project", "Type", "Currency", "Amount", "Note"]);
  for (const d of input.distributions) {
    rows.push([
      String(d.paid_at).slice(0, 10),
      names.get(d.product_id) ?? "Project",
      String(d.kind).replace(/_/g, " "),
      d.currency,
      Number(d.amount ?? 0),
      d.note ?? "",
    ]);
  }

  return toCsv(rows);
}
