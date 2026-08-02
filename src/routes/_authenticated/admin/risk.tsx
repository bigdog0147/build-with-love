import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/admin/shell";
import { Badge, Button, Panel, PanelHead, StatCard, inputCx } from "@/components/admin/kit";
import { decideRiskEvent, getRiskOverview, updateRiskRule } from "@/lib/risk.functions";

export const Route = createFileRoute("/_authenticated/admin/risk")({
  component: RiskPage,
  head: () => ({
    meta: [
      { title: "Fraud Detection | Gigafactory 3X Administration" },
      {
        name: "description",
        content:
          "Rule-based fraud scoring for GF3X money movements: review flagged events, clear or block them and retune rule weights.",
      },
      { property: "og:title", content: "Fraud Detection | Gigafactory 3X Administration" },
      { property: "og:description", content: "Risk scoring and review queue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function bandTone(band: string): "success" | "gold" | "danger" {
  return band === "block" ? "danger" : band === "review" ? "gold" : "success";
}

function RiskPage() {
  const load = useServerFn(getRiskOverview);
  const decide = useServerFn(decideRiskEvent);
  const tune = useServerFn(updateRiskRule);
  const qc = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, { weight: string; threshold: string }>>({});

  const { data } = useQuery({ queryKey: ["risk-overview"], queryFn: () => load({} as never) });
  const events = data?.events ?? [];
  const rules = data?.rules ?? [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ["risk-overview"] });

  const decideM = useMutation({
    mutationFn: (input: { id: string; decision: "cleared" | "blocked" }) => decide({ data: input }),
    onSuccess: (r) => {
      setNotice(r.message);
      invalidate();
    },
    onError: (e: Error) => setNotice(e.message),
  });

  const tuneM = useMutation({
    mutationFn: (input: { key: string; weight?: number; threshold?: number; is_enabled?: boolean }) =>
      tune({ data: input }),
    onSuccess: (r) => {
      setNotice(r.message);
      invalidate();
    },
    onError: (e: Error) => setNotice(e.message),
  });

  return (
    <AdminShell
      eyebrow="Security"
      title="Fraud detection"
      sub="Every deposit, withdrawal and conversion is scored before it is accepted. Scores at or above 40 land in review; 75 and above are blocked outright."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Scored events" value={events.length} />
        <StatCard label="Blocked" value={data?.counts.blocked ?? 0} tone="danger" />
        <StatCard label="Flagged for review" value={data?.counts.review ?? 0} tone="gold" />
        <StatCard label="Awaiting decision" value={data?.counts.pending ?? 0} tone="electric" />
      </div>

      {notice && <p className="text-xs text-[var(--gold)]">{notice}</p>}

      <Panel>
        <PanelHead title="Review queue" sub="Newest scored money movements" />
        <ul className="divide-y divide-white/6">
          {events.map((e) => (
            <li key={e.id} className="grid gap-2 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <p className="text-sm">
                  {String(e.customer ?? "Customer")} · {e.kind}
                  {e.amount != null ? ` · ${e.amount} ${e.currency ?? ""}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString()} · score {e.score} · {e.decision}
                  {e.ip ? ` · ${e.ip}` : ""}
                </p>
                {Array.isArray(e.triggered) && e.triggered.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {e.triggered.map((t) => (
                      <li key={t.key} className="text-xs text-muted-foreground">
                        <span className="text-foreground/80">{t.label}</span> (+{t.weight}) — {t.detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Badge tone={bandTone(e.band)}>{e.band}</Badge>
                {e.decision === "pending" && (
                  <>
                    <Button variant="ghost" onClick={() => decideM.mutate({ id: e.id, decision: "cleared" })}>
                      Clear
                    </Button>
                    <Button variant="danger" onClick={() => decideM.mutate({ id: e.id, decision: "blocked" })}>
                      Block
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
          {events.length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground sm:px-5">No scored events yet.</li>
          )}
        </ul>
      </Panel>

      <Panel>
        <PanelHead title="Scoring rules" sub="Weights and thresholds apply to every future assessment" />
        <ul className="divide-y divide-white/6">
          {rules.map((r) => {
            const d = draft[r.key] ?? { weight: String(r.weight), threshold: String(r.threshold) };
            return (
              <li key={r.key} className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="text-sm">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Weight
                    <input
                      className={inputCx + " ml-2 max-w-[90px]"}
                      value={d.weight}
                      inputMode="numeric"
                      onChange={(e) => setDraft((s) => ({ ...s, [r.key]: { ...d, weight: e.target.value } }))}
                    />
                  </label>
                  <label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Threshold
                    <input
                      className={inputCx + " ml-2 max-w-[110px]"}
                      value={d.threshold}
                      inputMode="decimal"
                      onChange={(e) => setDraft((s) => ({ ...s, [r.key]: { ...d, threshold: e.target.value } }))}
                    />
                  </label>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      tuneM.mutate({ key: r.key, weight: Number(d.weight), threshold: Number(d.threshold) })
                    }
                  >
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => tuneM.mutate({ key: r.key, is_enabled: !r.is_enabled })}>
                    {r.is_enabled ? "Disable" : "Enable"}
                  </Button>
                  <Badge tone={r.is_enabled ? "success" : "neutral"}>{r.is_enabled ? "Active" : "Off"}</Badge>
                </div>
              </li>
            );
          })}
          {rules.length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground sm:px-5">
              No rules configured — the engine falls back to its built-in defaults.
            </li>
          )}
        </ul>
      </Panel>
    </AdminShell>
  );
}
