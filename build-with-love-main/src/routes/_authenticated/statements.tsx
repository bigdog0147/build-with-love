import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { DashShell, PageHeading, money } from "@/components/dashboard-chrome";
import { getInvestorStatement } from "@/lib/documents.functions";
import { downloadCsv, statementCsv } from "@/lib/statement-csv";
import { summarisePortfolio, toPosition } from "@/lib/investments";

export const Route = createFileRoute("/_authenticated/statements")({
  component: StatementsPage,
  head: () => ({
    meta: [
      { title: "Financial reports — Gigafactory 3X" },
      {
        name: "description",
        content: "Generate a portfolio statement for any period and export it as CSV.",
      },
    ],
  }),
});

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function StatementsPage() {
  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const [from, setFrom] = useState(iso(yearStart));
  const [to, setTo] = useState(iso(today));
  const [range, setRange] = useState({ from: iso(yearStart), to: iso(today) });

  const fetchStatement = useServerFn(getInvestorStatement);
  const { data, isFetching } = useQuery({
    queryKey: ["investor-statement", range.from, range.to],
    queryFn: () => fetchStatement({ data: range }),
  });

  const positions = useMemo(
    () => (data?.holdings ?? []).map((h) => toPosition(h, data?.distributions ?? [])),
    [data?.holdings, data?.distributions],
  );
  const summary = useMemo(
    () => summarisePortfolio(positions, data?.products ?? []),
    [positions, data?.products],
  );
  const names = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of data?.products ?? []) map[p.id] = p.name;
    return map;
  }, [data?.products]);

  return (
    <DashShell>
      <PageHeading
        eyebrow="Financial reports"
        title="Portfolio statement"
        sub="Choose a period to produce a statement of positions, valuations and distributions."
      />

      <div className="glass flex flex-wrap items-end gap-3 rounded-2xl border border-border p-5 print:hidden">
        <label className="text-sm">
          <span className="block text-xs uppercase tracking-widest text-muted-foreground">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1.5 rounded-xl border border-border bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]/60"
          />
        </label>
        <label className="text-sm">
          <span className="block text-xs uppercase tracking-widest text-muted-foreground">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1.5 rounded-xl border border-border bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]/60"
          />
        </label>
        <button
          onClick={() => setRange({ from, to })}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground"
          style={{ background: "var(--gradient-gold)" }}
        >
          Generate
        </button>
        <button
          onClick={() => data && downloadCsv(`gf3x-statement-${range.from}-${range.to}.csv`, statementCsv(data))}
          disabled={!data}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm disabled:opacity-60"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm"
        >
          <Printer className="h-4 w-4" /> Print / PDF
        </button>
      </div>

      {isFetching && <p className="text-sm text-muted-foreground">Preparing statement…</p>}

      {data && (
        <article className="glass space-y-6 rounded-2xl border border-border p-6">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <div className="font-display text-2xl">Gigafactory 3X</div>
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Portfolio statement
              </div>
            </div>
            <div className="text-right text-sm">
              <div>{data.investor.name}</div>
              <div className="text-xs text-muted-foreground">
                {data.investor.membership} · {data.range.from} to {data.range.to}
              </div>
              <div className="text-xs text-muted-foreground">
                Generated {new Date(data.generatedAt).toLocaleString()}
              </div>
            </div>
          </header>

          <div className="grid gap-4 sm:grid-cols-4">
            <Figure label="Current value" value={money(summary.currentValue)} />
            <Figure label="Invested" value={money(summary.invested)} />
            <Figure label="Unrealised gain" value={`${summary.gainPct.toFixed(2)}%`} />
            <Figure label="Distributions" value={money(summary.distributions)} />
          </div>

          <Section title="Positions">
            <Table
              head={["Project", "Status", "Units", "Invested", "Value", "Gain"]}
              rows={positions.map((p) => [
                names[p.productId] ?? "Project",
                p.status,
                p.units.toLocaleString(),
                money(p.invested, p.currency),
                money(p.currentValue, p.currency),
                `${p.gain >= 0 ? "+" : ""}${p.gainPct.toFixed(2)}%`,
              ])}
              empty="No positions in this period."
            />
          </Section>

          <Section title="Valuations">
            <Table
              head={["Date", "Project", "Unit price", "Value"]}
              rows={(data.valuations ?? []).map((v) => [
                String(v.as_of).slice(0, 10),
                names[v.product_id] ?? "Project",
                Number(v.unit_price).toFixed(4),
                money(Number(v.value)),
              ])}
              empty="No valuations posted in this period."
            />
          </Section>

          <Section title="Distributions">
            <Table
              head={["Date", "Project", "Type", "Amount"]}
              rows={(data.distributions ?? []).map((d) => [
                String(d.paid_at).slice(0, 10),
                names[d.product_id] ?? "Project",
                String(d.kind).replace(/_/g, " "),
                money(Number(d.amount), d.currency),
              ])}
              empty="No distributions paid in this period."
            />
          </Section>

          <p className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
            This statement is generated from your account records and is provided for information only. It is
            not a tax document or a valuation certificate.
          </p>
        </article>
      )}
    </DashShell>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg">{title}</h2>
      <div className="mt-2 overflow-x-auto">{children}</div>
    </section>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: string[][]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <table className="w-full text-sm">
      <thead className="text-xs uppercase tracking-widest text-muted-foreground">
        <tr>
          {head.map((h, i) => (
            <th key={h} className={`px-3 py-2 font-normal ${i === 0 ? "text-left" : "text-right"}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60">
        {rows.map((r, ri) => (
          <tr key={ri}>
            {r.map((cell, ci) => (
              <td
                key={ci}
                className={`px-3 py-2 ${ci === 0 ? "text-left" : "text-right tabular-nums"} ${ci === 1 ? "capitalize" : ""}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
