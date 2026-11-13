import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/admin/shell";
import { Badge, Button, Panel, PanelHead, StatCard, inputCx } from "@/components/admin/kit";
import { getFxSnapshot, refreshFxRates, setCurrencyEnabled, setManualRate } from "@/lib/fx.functions";
import { RATE_STALE_MINUTES, isStale } from "@/lib/fx";

export const Route = createFileRoute("/_authenticated/admin/exchange-rates")({
  component: RatesPage,
  head: () => ({
    meta: [
      { title: "Exchange Rates | Gigafactory 3X Administration" },
      {
        name: "description",
        content:
          "Live multi-currency exchange rates for GF3X: refresh from the public feed, pin manual overrides and enable currencies platform-wide.",
      },
      { property: "og:title", content: "Exchange Rates | Gigafactory 3X Administration" },
      { property: "og:description", content: "Live exchange rate management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function RatesPage() {
  const load = useServerFn(getFxSnapshot);
  const refresh = useServerFn(refreshFxRates);
  const pin = useServerFn(setManualRate);
  const toggle = useServerFn(setCurrencyEnabled);
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: ["fx-snapshot"], queryFn: () => load({} as never) });
  const currencies = data?.currencies ?? [];
  const rates = data?.rates ?? [];
  const rateByCode = new Map(rates.map((r) => [r.code, r]));
  const newest = rates.reduce<string | null>(
    (acc, r) => (acc == null || r.fetched_at > acc ? r.fetched_at : acc),
    null,
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ["fx-snapshot"] });

  const refreshM = useMutation({
    mutationFn: () => refresh({} as never),
    onSuccess: (r) => {
      setNotice(r.ok ? `Updated ${r.updated} currencies from the feed.` : `Feed failed: ${r.error}`);
      invalidate();
    },
    onError: (e: Error) => setNotice(e.message),
  });

  const pinM = useMutation({
    mutationFn: (input: { code: string; rate: number | null }) => pin({ data: input }),
    onSuccess: () => {
      setNotice("Rate saved.");
      invalidate();
    },
    onError: (e: Error) => setNotice(e.message),
  });

  const toggleM = useMutation({
    mutationFn: (input: { code: string; enabled: boolean }) => toggle({ data: input }),
    onSuccess: invalidate,
    onError: (e: Error) => setNotice(e.message),
  });

  const stale = isStale(newest);

  return (
    <AdminShell
      eyebrow="Finance"
      title="Exchange rates"
      sub={`Fiat rates are pulled hourly from the ECB-backed public feed. Rates older than ${RATE_STALE_MINUTES} minutes are flagged as stale; manual overrides are never overwritten by the feed.`}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Currencies" value={currencies.length} />
        <StatCard label="Enabled" value={currencies.filter((c) => c.is_enabled).length} tone="success" />
        <StatCard label="Manual overrides" value={rates.filter((r) => r.is_manual).length} tone="gold" />
        <StatCard label="Stale currencies" value={rates.filter((r) => isStale(r.fetched_at)).length} tone={stale ? "gold" : "success"} />
      </div>

      <Panel>
        <PanelHead
          title="Live rate table"
          sub={
            data?.lastRun
              ? `Last refresh ${new Date(data.lastRun.created_at).toLocaleString()} · ${
                  data.lastRun.ok ? `${data.lastRun.currency_count} updated` : `failed: ${data.lastRun.error}`
                }`
              : "No refresh recorded yet."
          }
          right={
            <Button onClick={() => refreshM.mutate()} disabled={refreshM.isPending}>
              {refreshM.isPending ? "Refreshing…" : "Refresh now"}
            </Button>
          }
        />
        {notice && <p className="px-4 pb-2 text-xs text-[var(--gold)] sm:px-5">{notice}</p>}
        <ul className="divide-y divide-white/6">
          {currencies.map((c) => {
            const rate = rateByCode.get(c.code);
            const value = draft[c.code] ?? (rate ? String(rate.rate_to_usd) : "");
            return (
              <li key={c.code} className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[160px_minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="text-sm">
                    {c.code} <span className="text-muted-foreground">· {c.label}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rate ? `1 ${c.code} = ${rate.rate_to_usd} USD` : "No rate yet"}
                    {rate?.fetched_at ? ` · ${new Date(rate.fetched_at).toLocaleTimeString()}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className={inputCx + " max-w-[160px]"}
                    value={value}
                    inputMode="decimal"
                    aria-label={`Manual USD rate for ${c.code}`}
                    onChange={(e) => setDraft((d) => ({ ...d, [c.code]: e.target.value }))}
                  />
                  <Button
                    variant="ghost"
                    onClick={() => pinM.mutate({ code: c.code, rate: Number(value) })}
                    disabled={pinM.isPending}
                  >
                    Pin
                  </Button>
                  {rate?.is_manual && (
                    <Button variant="ghost" onClick={() => pinM.mutate({ code: c.code, rate: null })}>
                      Use feed
                    </Button>
                  )}
                  {rate?.is_manual ? <Badge tone="gold">Manual</Badge> : <Badge>{rate?.source ?? "—"}</Badge>}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Badge tone={c.is_enabled ? "success" : "neutral"}>{c.is_enabled ? "Enabled" : "Disabled"}</Badge>
                  <Button
                    variant="ghost"
                    onClick={() => toggleM.mutate({ code: c.code, enabled: !c.is_enabled })}
                    disabled={c.code === "USD"}
                  >
                    {c.is_enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </AdminShell>
  );
}
