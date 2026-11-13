import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  AlertTriangle,
  Check,
  CircleDashed,
  Clock,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { DashShell, PageHeading, cx } from "@/components/dashboard-chrome";
import { getKycStatus, getOwnKycDocumentUrl, statusMeta } from "@/lib/kyc.functions";

export const Route = createFileRoute("/_authenticated/verification-status")({
  component: VerificationStatusPage,
  head: () => ({
    meta: [
      { title: "Verification Status — Gigafactory 3X" },
      {
        name: "description",
        content:
          "Track your identity verification review progress, uploaded documents and the compliance decision on your Gigafactory 3X account.",
      },
      { property: "og:title", content: "Verification Status — Gigafactory 3X" },
      {
        property: "og:description",
        content: "Review progress and results for your identity verification.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function VerificationStatusPage() {
  const fetchStatus = useServerFn(getKycStatus);
  const signDoc = useServerFn(getOwnKycDocumentUrl);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  const { data, isPending, refetch, isRefetching } = useQuery({
    queryKey: ["kyc-status"],
    queryFn: () => fetchStatus(),
  });

  async function view(path: string) {
    setError(null);
    setOpening(path);
    try {
      const { url } = await signDoc({ data: { path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open document.");
    } finally {
      setOpening(null);
    }
  }

  const pill = data ? statusMeta(data.profile.id_status) : null;
  const status = data?.profile.id_status ?? "not_started";

  return (
    <DashShell>
      <PageHeading
        eyebrow="Compliance"
        title="Verification status"
        sub="Live progress of your identity review, the documents we hold on file, and the compliance outcome."
      />

      {isPending && <p className="text-sm text-muted-foreground">Loading your verification review…</p>}

      {error && (
        <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      {data && (
        <>
          <section className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {status === "verified"
                    ? "Your identity is verified"
                    : status === "rejected"
                      ? "Action required on your verification"
                      : status === "under_review"
                        ? "Your documents are under review"
                        : status === "submitted"
                          ? "Application submitted"
                          : "Verification not started"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.updated_at
                    ? `Last updated ${new Date(data.updated_at).toLocaleString()}`
                    : "No activity yet"}
                </div>
              </div>
              {pill && (
                <span className={cx("ml-auto rounded-full px-3 py-1 text-xs", pill.className)}>
                  {pill.label}
                </span>
              )}
              <button
                type="button"
                onClick={() => void refetch()}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-[var(--gold)]/60"
              >
                <RefreshCw className={cx("h-3.5 w-3.5", isRefetching && "animate-spin")} /> Refresh
              </button>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Profile completion</span>
                <span className="font-display text-foreground">{data.completion}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-elevated)]">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${data.completion}%`, background: "var(--gradient-gold)" }}
                />
              </div>
            </div>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-sm font-medium">Review progress</h2>
            <ol className="mt-4 space-y-4">
              {data.timeline.map((s) => (
                <li key={s.key} className="flex gap-3">
                  <span
                    className={cx(
                      "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs",
                      s.state === "done"
                        ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]"
                        : s.state === "current"
                          ? "border-[var(--gold)]/50 bg-[var(--gold)]/10 text-[var(--gold)]"
                          : s.state === "failed"
                            ? "border-[var(--danger)]/50 bg-[var(--danger)]/10 text-[var(--danger)]"
                            : "border-border text-muted-foreground",
                    )}
                  >
                    {s.state === "done" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : s.state === "current" ? (
                      <Clock className="h-3.5 w-3.5" />
                    ) : s.state === "failed" ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : (
                      <CircleDashed className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.detail}</div>
                    {s.at && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {new Date(s.at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-sm font-medium">Documents submitted</h2>
            <ul className="mt-3 divide-y divide-border/60">
              {data.documents.map((d) => (
                <li key={d.key} className="flex items-center gap-3 py-3">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{d.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.path ? "Received" : d.required ? "Required — not uploaded" : "Optional"}
                    </div>
                  </div>
                  {d.path && (
                    <button
                      type="button"
                      onClick={() => void view(d.path!)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:border-[var(--gold)]/60"
                    >
                      {opening === d.path ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      View
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/verify"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground"
              style={{ background: "var(--gradient-gold)" }}
            >
              {status === "rejected"
                ? "Re-upload documents"
                : status === "verified"
                  ? "Review my details"
                  : "Continue verification"}
            </Link>
            <Link
              to="/support"
              className="rounded-xl border border-border px-4 py-2.5 text-sm hover:border-[var(--gold)]/60"
            >
              Contact compliance
            </Link>
          </div>
        </>
      )}
    </DashShell>
  );
}
