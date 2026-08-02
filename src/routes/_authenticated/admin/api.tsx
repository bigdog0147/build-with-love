import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/components/admin/shell";
import { Badge, Button, Panel, PanelHead, StatCard, inputCx } from "@/components/admin/kit";
import {
  createWebhookEndpoint,
  getIntegrationOverview,
  issueApiKey,
  revokeApiKey,
  setWebhookEndpointActive,
} from "@/lib/integrations.functions";
import { createBackup } from "@/lib/backup.functions";

export const Route = createFileRoute("/_authenticated/admin/api")({
  component: ApiPage,
  head: () => ({
    meta: [
      { title: "API & Webhooks | Gigafactory 3X Administration" },
      {
        name: "description",
        content:
          "Register signed outbound webhooks, issue and revoke API keys, review delivery attempts and export a platform snapshot.",
      },
      { property: "og:title", content: "API & Webhooks | Gigafactory 3X Administration" },
      { property: "og:description", content: "Integration and backup control." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const SCOPES = ["read:wallets", "read:transactions", "read:kyc"];

function ApiPage() {
  const load = useServerFn(getIntegrationOverview);
  const addEndpoint = useServerFn(createWebhookEndpoint);
  const toggleEndpoint = useServerFn(setWebhookEndpointActive);
  const newKey = useServerFn(issueApiKey);
  const killKey = useServerFn(revokeApiKey);
  const backup = useServerFn(createBackup);
  const qc = useQueryClient();

  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [keyLabel, setKeyLabel] = useState("");
  const [scopes, setScopes] = useState<string[]>(["read:transactions"]);
  const [secret, setSecret] = useState<string | null>(null);
  const [issued, setIssued] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: ["integration-overview"], queryFn: () => load({} as never) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["integration-overview"] });
  const endpointName = (id: string) =>
    (data?.endpoints ?? []).find((e: any) => e.id === id)?.label ?? "Endpoint";

  const createM = useMutation({
    mutationFn: () => addEndpoint({ data: { label, url, events } }),
    onSuccess: (r) => {
      setSecret(r.secret);
      setNotice(r.message);
      setLabel("");
      setUrl("");
      setEvents([]);
      invalidate();
    },
    onError: (e: Error) => setNotice(e.message),
  });

  const toggleM = useMutation({
    mutationFn: (input: { id: string; active: boolean }) => toggleEndpoint({ data: input }),
    onSuccess: (r) => {
      setNotice(r.message);
      invalidate();
    },
    onError: (e: Error) => setNotice(e.message),
  });

  const keyM = useMutation({
    mutationFn: () => newKey({ data: { label: keyLabel, scopes } }),
    onSuccess: (r) => {
      setIssued(r.key);
      setNotice(r.message);
      setKeyLabel("");
      invalidate();
    },
    onError: (e: Error) => setNotice(e.message),
  });

  const revokeM = useMutation({
    mutationFn: (id: string) => killKey({ data: { id } }),
    onSuccess: (r) => {
      setNotice(r.message);
      invalidate();
    },
    onError: (e: Error) => setNotice(e.message),
  });

  const backupM = useMutation({
    mutationFn: () => backup({} as never),
    onSuccess: (r) => {
      const blob = new Blob([r.payload], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = r.filename;
      link.click();
      URL.revokeObjectURL(link.href);
      setNotice(`${r.message} Checksum ${r.checksum}.`);
      invalidate();
    },
    onError: (e: Error) => setNotice(e.message),
  });

  return (
    <AdminShell
      eyebrow="System"
      title="API, webhooks & backup"
      sub="Outbound events are signed with HMAC-SHA256 over timestamp and body. API keys are stored as hashes — the plaintext value is shown once, at issue time."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Endpoints" value={(data?.endpoints ?? []).length} />
        <StatCard
          label="Active"
          value={(data?.endpoints ?? []).filter((e: any) => e.is_active).length}
          tone="success"
        />
        <StatCard
          label="Failed deliveries"
          value={(data?.deliveries ?? []).filter((d: any) => d.status !== "delivered").length}
          tone="danger"
        />
        <StatCard
          label="Live API keys"
          value={(data?.keys ?? []).filter((k: any) => !k.revoked_at).length}
          tone="gold"
        />
      </div>

      {notice && <p className="text-xs text-[var(--gold)]">{notice}</p>}
      {secret && (
        <p className="break-all rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3 text-xs">
          Signing secret: <span className="font-mono">{secret}</span>
        </p>
      )}
      {issued && (
        <p className="break-all rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3 text-xs">
          API key: <span className="font-mono">{issued}</span>
        </p>
      )}

      <Panel>
        <PanelHead title="Webhook endpoints" sub="Https receivers notified on platform events" />
        <div className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[200px_minmax(0,1fr)_auto] lg:items-end">
          <label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Name
            <input className={inputCx + " mt-1"} value={label} onChange={(e) => setLabel(e.target.value)} />
          </label>
          <label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            URL
            <input
              className={inputCx + " mt-1"}
              value={url}
              placeholder="https://example.com/hooks/gf3x"
              onChange={(e) => setUrl(e.target.value)}
            />
          </label>
          <Button onClick={() => createM.mutate()} disabled={createM.isPending}>
            {createM.isPending ? "Saving…" : "Register"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 px-4 pb-4 sm:px-5">
          {(data?.events ?? []).map((ev: string) => {
            const on = events.includes(ev);
            return (
              <button
                key={ev}
                type="button"
                aria-pressed={on}
                onClick={() => setEvents((s) => (on ? s.filter((x) => x !== ev) : [...s, ev]))}
                className={
                  "rounded-lg border px-2.5 py-1 text-xs " +
                  (on ? "border-[var(--gold)]/50 bg-[var(--gold)]/10" : "border-border text-muted-foreground")
                }
              >
                {ev}
              </button>
            );
          })}
        </div>
        <ul className="divide-y divide-white/6 border-t border-white/6">
          {(data?.endpoints ?? []).map((e: any) => (
            <li key={e.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm">{e.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {e.url} · {e.events?.length ? e.events.join(", ") : "all events"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={e.is_active ? "success" : "neutral"}>{e.is_active ? "Active" : "Paused"}</Badge>
                <Button variant="ghost" onClick={() => toggleM.mutate({ id: e.id, active: !e.is_active })}>
                  {e.is_active ? "Pause" : "Activate"}
                </Button>
              </div>
            </li>
          ))}
          {(data?.endpoints ?? []).length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground sm:px-5">No endpoints registered.</li>
          )}
        </ul>
      </Panel>

      <Panel>
        <PanelHead title="Recent deliveries" sub="Newest 50 attempts" />
        <ul className="divide-y divide-white/6">
          {(data?.deliveries ?? []).map((d: any) => (
            <li key={d.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm">
                  {d.event} → {endpointName(d.endpoint_id)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {new Date(d.created_at).toLocaleString()} · HTTP {d.response_status ?? "—"}
                  {d.response_body ? ` · ${String(d.response_body).slice(0, 80)}` : ""}
                </p>
              </div>
              <Badge tone={d.status === "delivered" ? "success" : "danger"}>{d.status}</Badge>
            </li>
          ))}
          {(data?.deliveries ?? []).length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground sm:px-5">No deliveries yet.</li>
          )}
        </ul>
      </Panel>

      <Panel>
        <PanelHead title="API keys" sub="Read-only programmatic access" />
        <div className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-end">
          <label className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Label
            <input className={inputCx + " mt-1"} value={keyLabel} onChange={(e) => setKeyLabel(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            {SCOPES.map((s) => {
              const on = scopes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setScopes((cur) => (on ? cur.filter((x) => x !== s) : [...cur, s]))}
                  className={
                    "rounded-lg border px-2.5 py-1 text-xs " +
                    (on ? "border-[var(--gold)]/50 bg-[var(--gold)]/10" : "border-border text-muted-foreground")
                  }
                >
                  {s}
                </button>
              );
            })}
          </div>
          <Button onClick={() => keyM.mutate()} disabled={keyM.isPending}>
            {keyM.isPending ? "Issuing…" : "Issue key"}
          </Button>
        </div>
        <ul className="divide-y divide-white/6 border-t border-white/6">
          {(data?.keys ?? []).map((k: any) => (
            <li key={k.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm">
                  {k.label} · <span className="font-mono text-xs">{k.prefix}…</span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {(k.scopes ?? []).join(", ")} · last used{" "}
                  {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : "never"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={k.revoked_at ? "neutral" : "success"}>{k.revoked_at ? "Revoked" : "Live"}</Badge>
                {!k.revoked_at && (
                  <Button variant="danger" onClick={() => revokeM.mutate(k.id)}>
                    Revoke
                  </Button>
                )}
              </div>
            </li>
          ))}
          {(data?.keys ?? []).length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground sm:px-5">No keys issued.</li>
          )}
        </ul>
      </Panel>

      <Panel>
        <PanelHead
          title="Backup & recovery"
          sub="Download a checksummed JSON snapshot of the operational tables"
          right={
            <Button onClick={() => backupM.mutate()} disabled={backupM.isPending}>
              {backupM.isPending ? "Building…" : "Create snapshot"}
            </Button>
          }
        />
        <ul className="divide-y divide-white/6">
          {(data?.backups ?? []).map((b: any) => (
            <li key={b.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm">
                  {new Date(b.created_at).toLocaleString()} · {b.total_rows} rows
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {b.error ?? `checksum ${b.checksum ?? "—"} · ${(b.tables ?? []).length} tables`}
                </p>
              </div>
              <Badge tone={b.status === "complete" ? "success" : "danger"}>{b.status}</Badge>
            </li>
          ))}
          {(data?.backups ?? []).length === 0 && (
            <li className="px-4 py-6 text-sm text-muted-foreground sm:px-5">No snapshots yet.</li>
          )}
        </ul>
      </Panel>
    </AdminShell>
  );
}
