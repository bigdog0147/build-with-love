import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CircleDashed, FileText } from "lucide-react";
import { DashShell, PageHeading } from "@/components/dashboard-chrome";
import { listCustomerDocuments } from "@/lib/customer.functions";

export const Route = createFileRoute("/_authenticated/documents")({
  component: DocumentsPage,
  head: () => ({
    meta: [
      { title: "Documents — Gigafactory 3X" },
      {
        name: "description",
        content: "Identity documents on file and their verification status.",
      },
    ],
  }),
});

function DocumentsPage() {
  const fetchDocuments = useServerFn(listCustomerDocuments);
  const { data, isLoading } = useQuery({
    queryKey: ["customer-documents"],
    queryFn: () => fetchDocuments({} as never),
  });

  return (
    <DashShell>
      <PageHeading
        eyebrow="Compliance"
        title="Documents"
        sub="Your identity documents are encrypted at rest and visible only to you and compliance officers."
      />
      <div className="glass rounded-2xl p-2">
        {isLoading && <p className="p-6 text-sm text-muted-foreground">Loading documents…</p>}
        <ul className="divide-y divide-border/60">
          {(data ?? []).map((doc) => (
            <li key={doc.key} className="flex items-center gap-3 px-4 py-4">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm capitalize">{doc.label}</div>
                <div className="text-xs capitalize text-muted-foreground">
                  {doc.status.replace(/_/g, " ")}
                </div>
              </div>
              {doc.uploaded ? (
                <span className="flex items-center gap-1.5 text-xs text-[var(--success)]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> On file
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CircleDashed className="h-3.5 w-3.5" /> Missing
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-3">
      <Link
        to="/verification-status"
        className="inline-block rounded-xl border border-border px-4 py-2.5 text-sm hover:border-[var(--gold)]/60"
      >
        View review status
      </Link>
      <Link
        to="/verify"
        className="inline-block rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground"
        style={{ background: "var(--gradient-gold)" }}
      >
        Manage verification
      </Link>
      </div>
    </DashShell>
  );
}
