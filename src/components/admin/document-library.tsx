import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AdminDocumentDeliveryLog } from "@/components/admin/document-delivery-log";
import { Panel, PanelHead } from "@/components/admin/kit";
import {
  adminCreateDocument,
  adminCreateDocumentUploadUrl,
  adminDeleteDocument,
  adminListDocuments,
  adminSetDocumentPublished,
} from "@/lib/documents.functions";

type DocRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  visibility: string;
  product_id: string | null;
  user_id: string | null;
  file_name: string;
  file_size: number;
  is_published: boolean;
  created_at: string;
};
type NamedRow = { id: string; name?: string; display_name?: string };
type LibraryData = { documents: DocRow[]; products: NamedRow[]; investors: NamedRow[] };

const input =
  "w-full rounded-lg border border-white/10 bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]/60";
const btn = "rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:border-[var(--gold)]/60";

const CATEGORIES = ["prospectus", "factsheet", "report", "statement", "legal", "other"];
const VISIBILITIES = [
  { key: "all_investors", label: "All investors" },
  { key: "product_subscribers", label: "Product subscribers" },
  { key: "single_investor", label: "One investor" },
];

export function AdminDocumentLibrary() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useServerFn(adminListDocuments);
  const createUpload = useServerFn(adminCreateDocumentUploadUrl);
  const create = useServerFn(adminCreateDocument);
  const setPublished = useServerFn(adminSetDocumentPublished);
  const remove = useServerFn(adminDeleteDocument);

  const { data } = useQuery({
    queryKey: ["admin-documents"],
    queryFn: async () => (await list({} as never)) as LibraryData,
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "prospectus",
    visibility: "all_investors",
    productId: "",
    investorId: "",
    isPublished: true,
  });
  const [busy, setBusy] = useState(false);

  const refresh = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ["admin-documents"] });
  };
  const fail = (e: unknown) => toast.error(e instanceof Error ? e.message : "Action failed.");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file to upload.");
      return;
    }
    setBusy(true);
    try {
      const target = await createUpload({ data: { fileName: file.name } });
      const put = await fetch(target.signedUrl, {
        method: "PUT",
        headers: { "content-type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error("The file upload failed. Please try again.");
      const result = await create({
        data: {
          title: form.title,
          description: form.description,
          category: form.category,
          visibility: form.visibility,
          productId: form.visibility === "product_subscribers" ? form.productId || null : null,
          investorId: form.visibility === "single_investor" ? form.investorId || null : null,
          filePath: target.path,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type || "application/octet-stream",
          isPublished: form.isPublished,
        },
      });
      if (fileRef.current) fileRef.current.value = "";
      setForm({ ...form, title: "", description: "" });
      refresh(result.message);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  const publish = useMutation({
    mutationFn: (vars: { id: string; isPublished: boolean }) => setPublished({ data: vars }),
    onSuccess: (r) => refresh(r.message),
    onError: fail,
  });
  const destroy = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: (r) => refresh(r.message),
    onError: fail,
  });

  const productName = new Map((data?.products ?? []).map((p) => [p.id, p.name ?? ""]));
  const investorName = new Map((data?.investors ?? []).map((p) => [p.id, p.display_name ?? ""]));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Panel>
        <PanelHead title="Document library" sub="Files investors can download from their library." />
        <ul className="divide-y divide-white/10">
          {(data?.documents ?? []).map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{d.title}</div>
                <div className="text-xs text-muted-foreground">
                  <span className="capitalize">{d.category}</span> ·{" "}
                  {d.visibility === "single_investor"
                    ? `Investor: ${investorName.get(d.user_id ?? "") ?? "—"}`
                    : d.visibility === "product_subscribers"
                      ? `Subscribers: ${productName.get(d.product_id ?? "") ?? "—"}`
                      : "All investors"}{" "}
                  · {(d.file_size / 1024).toFixed(0)} KB · {d.is_published ? "Published" : "Hidden"}
                </div>
              </div>
              <button
                className={btn}
                onClick={() => publish.mutate({ id: d.id, isPublished: !d.is_published })}
              >
                {d.is_published ? "Hide" : "Publish"}
              </button>
              <button className={btn} onClick={() => destroy.mutate(d.id)}>
                Delete
              </button>
            </li>
          ))}
          {(data?.documents ?? []).length === 0 && (
            <li className="px-5 py-6 text-sm text-muted-foreground">No documents yet.</li>
          )}
        </ul>
      </Panel>

      <Panel>
        <PanelHead title="Add a document" />
        <form className="space-y-3 p-5" onSubmit={submit}>
          <input
            className={input}
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className={`${input} min-h-20`}
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              className={input}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c[0]?.toUpperCase()}
                  {c.slice(1)}
                </option>
              ))}
            </select>
            <select
              className={input}
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            >
              {VISIBILITIES.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          {form.visibility === "product_subscribers" && (
            <select
              className={input}
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">Select a product…</option>
              {(data?.products ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          {form.visibility === "single_investor" && (
            <select
              className={input}
              value={form.investorId}
              onChange={(e) => setForm({ ...form, investorId: e.target.value })}
            >
              <option value="">Select an investor…</option>
              {(data?.investors ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          )}
          <input ref={fileRef} type="file" className={`${input} py-1.5`} />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            Publish immediately
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg px-3.5 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
            style={{ background: "var(--gradient-gold)" }}
          >
            {busy ? "Uploading…" : "Add document"}
          </button>
        </form>
      </Panel>
      <AdminDocumentDeliveryLog
        documents={(data?.documents ?? []).map((d) => ({ id: d.id, title: d.title }))}
      />
    </div>
  );
}
