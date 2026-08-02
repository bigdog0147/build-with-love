import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/dashboard.functions";
import {
  convertBetweenWallets,
  getFxSnapshot,
  openWallet,
  quoteConversion,
} from "@/lib/fx.functions";
import { toRateMap, toUsd, type RateMap } from "@/lib/fx";
import { DashShell, PageHeading, money } from "@/components/dashboard-chrome";
import { QuickActions } from "@/components/quick-actions";

export const Route = createFileRoute("/_authenticated/wallets")({
  component: WalletsPage,
  head: () => ({
    meta: [
      { title: "Wallets — Gigafactory 3" },
      {
        name: "description",
        content:
          "Every multi-currency wallet, live USD valuation and instant currency conversion in one place.",
      },
      { property: "og:title", content: "Wallets — Gigafactory 3" },
      { property: "og:description", content: "Multi-currency holdings, live rates and conversions." },
    ],
  }),
});

function WalletsPage() {
  const fetchDash = useServerFn(getDashboard);
  const fetchFx = useServerFn(getFxSnapshot);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDash({} as never) });
  const { data: fx } = useQuery({ queryKey: ["fx-snapshot"], queryFn: () => fetchFx({} as never) });

  const wallets = data?.wallets ?? [];
  const rates: RateMap = useMemo(() => toRateMap(fx?.rates ?? []), [fx?.rates]);

  return (
    <DashShell>
      <PageHeading
        eyebrow="Wallets"
        title="Multi-currency holdings"
        sub="Fund, convert and monitor every wallet. USD values are recalculated from live exchange rates."
      />
      <QuickActions wallets={wallets} variant="plain" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {wallets.map((w) => {
          const delta = Number(w.delta_pct);
          const tint = w.tint === "gold" ? "var(--gold)" : w.tint === "electric" ? "var(--electric)" : "var(--silver)";
          const usd = toUsd(Number(w.balance), w.code, rates) ?? (w.fiat_value != null ? Number(w.fiat_value) : null);
          return (
            <div key={w.id} className="relative overflow-hidden rounded-2xl border border-border p-5 glass">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 blur-2xl" style={{ background: tint }} />
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{w.label}</div>
                <span className={delta >= 0 ? "text-[11px] text-[var(--success)]" : "text-[11px] text-[var(--danger)]"}>
                  {delta >= 0 ? "+" : ""}
                  {delta.toFixed(2)}%
                </span>
              </div>
              <div className="mt-4 font-display text-2xl">{money(Number(w.balance), w.code)}</div>
              {usd != null && w.code !== "USD" && (
                <div className="mt-1 text-xs text-muted-foreground">≈ {money(usd, "USD")} at live rate</div>
              )}
            </div>
          );
        })}
        {wallets.length === 0 && <p className="text-sm text-muted-foreground">No wallets yet.</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ConvertPanel wallets={wallets} />
        <OpenWalletPanel
          currencies={(fx?.currencies ?? []).filter((c) => c.is_enabled)}
          held={wallets.map((w) => w.code)}
        />
      </div>
    </DashShell>
  );
}

const field =
  "w-full rounded-lg border border-border bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]/60";

function ConvertPanel({ wallets }: { wallets: { id: string; code: string; label: string }[] }) {
  const quoteFn = useServerFn(quoteConversion);
  const convertFn = useServerFn(convertBetweenWallets);
  const qc = useQueryClient();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const quote = useMutation({
    mutationFn: () =>
      quoteFn({ data: { fromWalletId: from, toWalletId: to, amount: Number(amount) } }),
    onError: (e: Error) => setMessage(e.message),
    onSuccess: () => setMessage(null),
  });

  const run = useMutation({
    mutationFn: () =>
      convertFn({ data: { fromWalletId: from, toWalletId: to, amount: Number(amount) } }),
    onSuccess: (r) => {
      setMessage(r.message);
      quote.reset();
      setAmount("");
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => setMessage(e.message),
  });

  return (
    <div className="rounded-2xl border border-border p-6 glass">
      <h2 className="font-display text-xl">Convert currency</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Live mid-market rate with a 0.35% conversion spread. The quoted rate is the rate applied.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted-foreground">
          From
          <select className={field + " mt-1"} value={from} onChange={(e) => setFrom(e.target.value)}>
            <option value="">Select wallet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} · {w.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">
          To
          <select className={field + " mt-1"} value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Select wallet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} · {w.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-3 block text-xs text-muted-foreground">
        Amount
        <input
          className={field + " mt-1"}
          value={amount}
          inputMode="decimal"
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
      </label>

      {quote.data && (
        <div className="mt-4 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rate</span>
            <span className="tabular-nums">
              1 {quote.data.from.code} = {quote.data.rate} {quote.data.to.code}
            </span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-muted-foreground">Spread ({quote.data.spreadPct}%)</span>
            <span className="tabular-nums">
              −{(quote.data.gross - quote.data.net).toFixed(2)} {quote.data.to.code}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-display">
            <span>You receive</span>
            <span className="tabular-nums">
              {quote.data.net} {quote.data.to.code}
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-border px-4 py-2 text-sm hover:border-[var(--gold)]/60"
          onClick={() => quote.mutate()}
          disabled={quote.isPending}
        >
          {quote.isPending ? "Quoting…" : "Get quote"}
        </button>
        <button
          type="button"
          className="rounded-lg px-4 py-2 text-sm text-black disabled:opacity-50"
          style={{ background: "var(--gradient-gold)" }}
          onClick={() => run.mutate()}
          disabled={!quote.data || run.isPending}
        >
          {run.isPending ? "Converting…" : "Confirm conversion"}
        </button>
      </div>
      {message && <p className="mt-3 text-xs text-[var(--gold)]">{message}</p>}
    </div>
  );
}

function OpenWalletPanel({
  currencies,
  held,
}: {
  currencies: { code: string; label: string; symbol: string }[];
  held: string[];
}) {
  const open = useServerFn(openWallet);
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const available = currencies.filter((c) => !held.includes(c.code));

  const mutation = useMutation({
    mutationFn: () => open({ data: { code } }),
    onSuccess: (r) => {
      setMessage(r.message);
      setCode("");
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => setMessage(e.message),
  });

  return (
    <div className="rounded-2xl border border-border p-6 glass">
      <h2 className="font-display text-xl">Open a wallet</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Hold balances in any currency enabled by the treasury desk.
      </p>
      <label className="mt-4 block text-xs text-muted-foreground">
        Currency
        <select className={field + " mt-1"} value={code} onChange={(e) => setCode(e.target.value)}>
          <option value="">Select currency</option>
          {available.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} · {c.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="mt-4 rounded-lg border border-border px-4 py-2 text-sm hover:border-[var(--gold)]/60 disabled:opacity-50"
        onClick={() => mutation.mutate()}
        disabled={!code || mutation.isPending}
      >
        {mutation.isPending ? "Opening…" : "Open wallet"}
      </button>
      {available.length === 0 && (
        <p className="mt-3 text-xs text-muted-foreground">You already hold every enabled currency.</p>
      )}
      {message && <p className="mt-3 text-xs text-[var(--gold)]">{message}</p>}
    </div>
  );
}
