import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { FileCheck2, Loader2, RefreshCw, Trash2, Upload, Eye } from "lucide-react";
import {
  deleteExternalKycDocument,
  getExternalKycDocumentUrl,
  listExternalKyc,
  setExternalKycStatus,
  uploadExternalKycDocument,
  KYC_SLOTS,
  type AdminKycRow,
  type KycSlot,
} from "@/lib/kyc-admin.functions";

export const Route = createFileRoute("/_authenticated/admin/kyc")({
  component: AdminKycPage,
  head: () => ({
    meta: [
      { title: "KYC Documents | Gigafactory 3X Admin" },
      {
        name: "description",
        content:
          "Upload, review and manage identity verification documents stored in the external Gigafactory 3X backend.",
      },
      { property: "og:title", content: "KYC Documents | Gigafactory 3X Admin" },
      {
        property: "og:description",
        content: "Admin console for identity verification documents.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const SLOT_LABEL: Record<KycSlot, string> = {
  doc_front_path: "Document front",
  doc_back_path: "Document back",
  selfie_path: "Selfie / liveness",
};

const STATUSES = ["not_started", "submitted", "under_review", "verified", "rejected"];

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function AdminKycPage() {
  const list = useServerFn(listExternalKyc);
  const upload = useServerFn(uploadExternalKycDocument);
  const remove = useServerFn(deleteExternalKycDocument);
  const sign = useServerFn(getExternalKycDocumentUrl);
  const setStatus = useServerFn(setExternalKycStatus);

  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const records = useQuery({
    queryKey: ["admin-kyc"],
    queryFn: () => list(),
    retry: false,
  });

  const mutate = useMutation({
    mutationFn: async (run: () => Promise<unknown>) => run(),
    onSuccess: () => records.refetch(),
  });

  const rows: AdminKycRow[] = records.data?.rows ?? [];
  const active = rows.find((r) => r.user_id === selected) ?? null;

  async function handleFile(userId: string, slot: KycSlot, file: File) {
    setError(null);
    setBusy(`${userId}:${slot}`);
    try {
      const base64 = await toBase64(file);
      await mutate.mutateAsync(() =>
        upload({
          data: {
            userId,
            slot,
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            base64,
          },
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function view(path: string) {
    setError(null);
    try {
      const { url } = await sign({ data: { path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]">Administration</p>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold sm:text-3xl">
          <FileCheck2 className="h-6 w-6 text-[var(--gold)]" />
          KYC documents
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Files are uploaded to the external backend's private storage and linked to the
          matching verification record. Access is restricted to administrators and signed
          links expire after five minutes.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <section className="glass overflow-hidden rounded-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border px-5 py-3 text-sm">
          <span className="font-medium">
            {records.isPending ? "Loading records…" : `${rows.length} verification record(s)`}
          </span>
          <button
            type="button"
            onClick={() => records.refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-[var(--gold)]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {records.error ? (
          <p className="px-5 py-6 text-sm text-[var(--danger)]">
            {(records.error as Error).message}
          </p>
        ) : rows.length === 0 && !records.isPending ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            No verification records found on the external backend yet.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((r) => {
              const uploaded = KYC_SLOTS.filter((s) => r[s]).length;
              return (
                <li key={r.user_id}>
                  <button
                    type="button"
                    onClick={() => setSelected(selected === r.user_id ? null : r.user_id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left text-sm hover:bg-white/5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {r.full_legal_name ?? "Unnamed applicant"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {r.user_id}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-xs">
                      <span className="text-muted-foreground">{uploaded}/3 files</span>
                      <span className="rounded-full border border-border px-2 py-0.5">
                        {r.id_status.replace("_", " ")}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {active && (
        <section className="glass mt-6 rounded-2xl border border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {active.full_legal_name ?? "Unnamed applicant"}
            </h2>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Status
              <select
                value={active.id_status}
                onChange={(e) =>
                  mutate.mutate(() =>
                    setStatus({ data: { userId: active.user_id, status: e.target.value } }),
                  )
                }
                className="rounded-lg border border-border bg-transparent px-2 py-1 text-xs"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-black">
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {KYC_SLOTS.map((slot) => {
              const path = active[slot];
              const key = `${active.user_id}:${slot}`;
              return (
                <div key={slot} className="rounded-xl border border-border p-4">
                  <p className="text-sm font-medium">{SLOT_LABEL[slot]}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {path ?? "No file linked"}
                  </p>

                  <input
                    ref={(el) => {
                      inputs.current[key] = el;
                    }}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/heic,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleFile(active.user_id, slot, f);
                      e.target.value = "";
                    }}
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy === key}
                      onClick={() => inputs.current[key]?.click()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:border-[var(--gold)] disabled:opacity-50"
                    >
                      {busy === key ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      {path ? "Replace" : "Upload"}
                    </button>
                    {path && (
                      <>
                        <button
                          type="button"
                          onClick={() => void view(path)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:border-[var(--gold)]"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            mutate.mutate(() =>
                              remove({ data: { userId: active.user_id, slot } }),
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-[var(--danger)] hover:border-[var(--danger)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <EmailDeliveryPanel userId={active.user_id} />
        </section>
      )}

    </main>
  );
}
