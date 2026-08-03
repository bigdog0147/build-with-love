import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Download, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { DashShell, PageHeading } from "@/components/dashboard-chrome";
import { getDocumentDownloadUrl, listInvestorDocuments } from "@/lib/documents.functions";

export const Route = createFileRoute("/_authenticated/library")({
  component: LibraryPage,
  head: () => ({
    meta: [
      { title: "Document library — Gigafactory 3X" },
      {
        name: "description",
        content: "Prospectuses, factsheets, agreements, reports and statements available to you.",
      },
    ],
  }),
});

const CATEGORIES = [
  "all",
  "prospectus",
  "factsheet",
  "term_sheet",
  "report",
  "statement",
  "agreement",
] as const;

function LibraryPage() {
  const fetchDocuments = useServerFn(listInvestorDocuments);
  const download = useServerFn(getDocumentDownloadUrl);
  const { data, isLoading } = useQuery({
    queryKey: ["investor-documents"],
    queryFn: () => fetchDocuments({} as never),
  });

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const [term, setTerm] = useState("");

  const documents = useMemo(() => {
    const q = term.trim().toLowerCase();
    return (data?.documents ?? []).filter((d) => {
      if (category !== "all" && d.category !== category) return false;
      if (!q) return true;
      return `${d.title} ${d.description ?? ""}`.toLowerCase().includes(q);
    });
  }, [data?.documents, category, term]);

  const open = useMutation({
    mutationFn: (id: string) => download({ data: { id } }),
    onSuccess: (res) => window.open(res.url, "_blank", "noopener"),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Download failed."),
  });

  return (
    <DashShell>
      <PageHeading
        eyebrow="Documents"
        title="Document library"
        sub="Every document published to your account. Downloads are issued through short-lived private links."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search documents"
            className="w-full rounded-xl border border-border bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--gold)]/60"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-xs capitalize ${
                category === c
                  ? "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-foreground"
                  : "border-border text-muted-foreground"
              }`}
            >
              {c.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl border border-border p-2">
        {isLoading && <p className="p-6 text-sm text-muted-foreground">Loading documents…</p>}
        <ul className="divide-y divide-border/60">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 px-4 py-4">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{doc.title}</div>
                <div className="text-xs capitalize text-muted-foreground">
                  {String(doc.category).replace(/_/g, " ")}
                  {doc.product_id && data?.productNames[doc.product_id]
                    ? ` · ${data.productNames[doc.product_id]}`
                    : ""}{" "}
                  · {new Date(doc.published_at).toLocaleDateString()} ·{" "}
                  {(Number(doc.file_size) / 1024).toFixed(0)} KB
                </div>
                {doc.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{doc.description}</p>
                )}
              </div>
              <button
                onClick={() => open.mutate(doc.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-[var(--gold)]/60"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            </li>
          ))}
          {!isLoading && documents.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              No documents match this filter.
            </li>
          )}
        </ul>
      </div>
    </DashShell>
  );
}
