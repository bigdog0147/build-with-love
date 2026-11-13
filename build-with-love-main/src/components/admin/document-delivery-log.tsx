import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Panel, PanelHead } from "@/components/admin/kit";
import {
  adminListDocumentDeliveries,
  adminRetryDocumentDeliveries,
  type DocumentDeliveryRow,
} from "@/lib/documents.functions";

const control =
  "rounded-lg border border-white/10 bg-[var(--surface)] px-3 py-1.5 text-xs outline-none focus:border-[var(--gold)]/60";

const STATUSES = [
  { key: "", label: "All statuses" },
  { key: "queued", label: "Queued" },
  { key: "sent", label: "Sent" },
  { key: "retrying", label: "Retrying" },
  { key: "skipped", label: "Skipped" },
  { key: "failed", label: "Failed" },
];

const TONE: Record<string, string> = {
  sent: "text-emerald-300 border-emerald-400/30",
  queued: "text-amber-200 border-amber-300/30",
  retrying: "text-sky-300 border-sky-400/30",
  skipped: "text-muted-foreground border-white/15",
  failed: "text-rose-300 border-rose-400/30",
};

function stamp(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function channels(row: DocumentDeliveryRow) {
  const parts: string[] = [];
  if (row.inapp_sent) parts.push("In-app");
  if (row.email_sent) parts.push("Email");
  return parts.length ? parts.join(" + ") : "—";
}

export function AdminDocumentDeliveryLog({ documents }: { documents: { id: string; title: string }[] }) {
  const listDeliveries = useServerFn(adminListDocumentDeliveries);
  const retryDeliveries = useServerFn(adminRetryDocumentDeliveries);
  const queryClient = useQueryClient();
  const [documentId, setDocumentId] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-document-deliveries", documentId, status],
    queryFn: () =>
      listDeliveries({
        data: { documentId: documentId || null, status: status || null },
      }),
  });

  const retry = useMutation({
    mutationFn: (vars: { deliveryIds?: string[]; documentId?: string | null }) =>
      retryDeliveries({ data: vars }),
    onSuccess: (r) => {
      toast.success(r.message);
      queryClient.invalidateQueries({ queryKey: ["admin-document-deliveries"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Retry failed."),
  });

  const rows = data?.deliveries ?? [];
  const counts = useMemo(() => {
    const acc: Record<string, number> = { queued: 0, sent: 0, retrying: 0, skipped: 0, failed: 0 };
    for (const r of rows) acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, [rows]);

  return (
    <Panel className="lg:col-span-2">
      <PanelHead
        title="Notification delivery log"
        sub="Every document-published notice per investor — queued, sent, retrying or failed. Transient provider errors retry automatically."
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-5 pb-4">
        <select className={control} value={documentId} onChange={(e) => setDocumentId(e.target.value)}>
          <option value="">All documents</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
        <select className={control} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:border-[var(--gold)]/60 disabled:opacity-60"
          disabled={retry.isPending || !(counts.retrying + counts.failed)}
          onClick={() => retry.mutate({ documentId: documentId || null })}
        >
          {retry.isPending ? "Retrying…" : "Retry unsent"}
        </button>
        <div className="ml-auto flex gap-3 text-xs text-muted-foreground">
          <span>{counts.sent} sent</span>
          <span>{counts.queued} queued</span>
          <span className={counts.retrying ? "text-sky-300" : undefined}>
            {counts.retrying} retrying
          </span>
          <span>{counts.skipped} skipped</span>
          <span className={counts.failed ? "text-rose-300" : undefined}>{counts.failed} failed</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-white/10">
              <th className="px-5 py-3 font-normal">Investor</th>
              <th className="px-3 py-3 font-normal">Document</th>
              <th className="px-3 py-3 font-normal">Status</th>
              <th className="px-3 py-3 font-normal">Channels</th>
              <th className="px-3 py-3 font-normal">Queued</th>
              <th className="px-3 py-3 font-normal">Sent</th>
              <th className="px-3 py-3 font-normal">Failed</th>
              <th className="px-3 py-3 font-normal">Attempts</th>
              <th className="px-3 py-3 font-normal">Next try</th>
              <th className="px-3 py-3 font-normal">Detail</th>
              <th className="px-5 py-3 font-normal" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <td className="px-5 py-3">{data?.investorNames?.[row.user_id] ?? "Investor"}</td>
                <td className="px-3 py-3">{data?.documentTitles?.[row.document_id] ?? "—"}</td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-full border px-2 py-0.5 capitalize ${TONE[row.status] ?? "border-white/15"}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-3">{channels(row)}</td>
                <td className="px-3 py-3 text-muted-foreground">{stamp(row.queued_at)}</td>
                <td className="px-3 py-3 text-muted-foreground">{stamp(row.sent_at)}</td>
                <td className="px-3 py-3 text-muted-foreground">{stamp(row.failed_at)}</td>
                <td className="px-3 py-3 text-muted-foreground">{row.attempts}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {row.status === "retrying" ? stamp(row.next_attempt_at) : "—"}
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {row.error ?? row.last_error ?? row.reason ?? "—"}
                </td>
                <td className="px-5 py-3">
                  {row.status === "retrying" || row.status === "failed" ? (
                    <button
                      className="rounded-lg border border-white/10 px-2.5 py-1 text-xs hover:border-[var(--gold)]/60 disabled:opacity-60"
                      disabled={retry.isPending}
                      onClick={() => retry.mutate({ deliveryIds: [row.id] })}
                    >
                      Retry now
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-5 py-6 text-sm text-muted-foreground" colSpan={10}>
                  {isLoading ? "Loading delivery log…" : "No notification deliveries recorded yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
