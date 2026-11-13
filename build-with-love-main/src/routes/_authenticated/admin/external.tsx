import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Database, RefreshCw, Table2 } from "lucide-react";
import {
  checkExternalSupabase,
  readExternalTable,
  type ExternalRow,
} from "@/lib/external-supabase.functions";

export const Route = createFileRoute("/_authenticated/admin/external")({
  component: ExternalDataPage,
  head: () => ({
    meta: [
      { title: "External Data Source | Gigafactory 3X Admin" },
      {
        name: "description",
        content:
          "Inspect and query the connected external database from the Gigafactory 3X administration console.",
      },
      { property: "og:title", content: "External Data Source | Gigafactory 3X Admin" },
      {
        property: "og:description",
        content: "Admin console for the connected external database.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ExternalDataPage() {
  const probe = useServerFn(checkExternalSupabase);
  const read = useServerFn(readExternalTable);
  const [table, setTable] = useState("");

  const status = useQuery({
    queryKey: ["external-supabase", "status"],
    queryFn: () => probe(),
    retry: false,
  });

  const rows = useMutation({
    mutationFn: (t: string) => read({ data: { table: t, limit: 50 } }),
  });

  const tables = status.data?.ok ? status.data.tables : [];
  const data: ExternalRow[] = rows.data?.rows ?? [];
  const columns = data.length ? Object.keys(data[0]) : [];

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]">
          Administration
        </p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold sm:text-3xl">
          <Database className="h-6 w-6 text-[var(--gold)]" />
          External data source
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Live connection to the secondary database project. Credentials are stored
          server-side and never exposed to the browser.
        </p>
      </header>

      <section className="glass rounded-2xl border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <span className="text-muted-foreground">Connection: </span>
            {status.isPending ? (
              <span>checking…</span>
            ) : status.error ? (
              <span className="text-[var(--danger)]">
                {(status.error as Error).message}
              </span>
            ) : status.data?.ok ? (
              <span className="text-[var(--success)]">
                connected · {tables.length} table(s) exposed
              </span>
            ) : (
              <span className="text-[var(--danger)]">
                unreachable (HTTP {status.data?.status})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => status.refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:border-[var(--gold)]"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {tables.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {tables.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTable(t);
                  rows.mutate(t);
                }}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  table === t
                    ? "border-[var(--gold)] text-[var(--gold)]"
                    : "border-border text-muted-foreground hover:border-[var(--gold)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </section>

      {table && (
        <section className="glass mt-6 overflow-hidden rounded-2xl border border-border">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3 text-sm">
            <Table2 className="h-4 w-4 text-[var(--gold)]" />
            <span className="font-medium">{table}</span>
            <span className="text-muted-foreground">
              {rows.isPending ? "loading…" : `${data.length} row(s)`}
            </span>
          </div>
          {rows.error ? (
            <p className="px-5 py-6 text-sm text-[var(--danger)]">
              {(rows.error as Error).message}
            </p>
          ) : data.length === 0 && !rows.isPending ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No rows.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    {columns.map((c) => (
                      <th key={c} className="whitespace-nowrap px-4 py-2 font-medium">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className="border-t border-border/60">
                      {columns.map((c) => (
                        <td
                          key={c}
                          className="max-w-[240px] truncate px-4 py-2 align-top"
                        >
                          {row[c] === null || row[c] === undefined
                            ? "—"
                            : typeof row[c] === "object"
                              ? JSON.stringify(row[c])
                              : String(row[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
