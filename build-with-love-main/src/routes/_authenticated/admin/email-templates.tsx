import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Code2, Eye, Loader2, Mail, Send } from "lucide-react";
import {
  KYC_EMAIL_STATUSES,
  KYC_STATUS_LABEL,
  renderKycEmailPreview,
  sendKycEmailTest,
  type KycEmailStatus,
} from "@/lib/email-preview.functions";
import { EmailTemplateEditor } from "@/components/admin/email-template-editor";


export const Route = createFileRoute("/_authenticated/admin/email-templates")({
  component: EmailTemplatesPage,
  head: () => ({
    meta: [
      { title: "KYC Email Templates — Gigafactory 3X Admin" },
      {
        name: "description",
        content:
          "Preview and test-send the KYC decision emails for submitted, in review, approved and needs-changes states.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type View = "rendered" | "text";

function EmailTemplatesPage() {
  const renderPreview = useServerFn(renderKycEmailPreview);
  const sendTest = useServerFn(sendKycEmailTest);

  const [status, setStatus] = useState<KycEmailStatus>("submitted");
  const [name, setName] = useState("Alex Morgan");
  const [view, setView] = useState<View>("rendered");
  const [to, setTo] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const preview = useQuery({
    queryKey: ["kyc-email-preview", status, name],
    queryFn: () => renderPreview({ data: { status, name } }),
    retry: false,
  });

  const test = useMutation({
    mutationFn: () => sendTest({ data: { status, name, to } }),
    onSuccess: (res) =>
      setNotice(
        res.ok
          ? { tone: "ok", text: `Test copy of the “${KYC_STATUS_LABEL[status]}” email sent to ${res.email}.` }
          : { tone: "error", text: res.reason },
      ),
    onError: (err) => setNotice({ tone: "error", text: (err as Error).message }),
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <Link
        to="/admin/kyc"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-[var(--gold)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to KYC verification
      </Link>

      <header className="mt-4">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Mail className="h-5 w-5 text-[var(--gold)]" /> KYC email templates
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Render the exact content applicants receive for each decision state, then send a
          real test copy to any inbox to confirm formatting and deliverability.
        </p>
      </header>

      <section className="mt-6 grid gap-4 rounded-xl border border-border p-4 md:grid-cols-[1fr_auto]">
        <div className="flex flex-wrap gap-2">
          {KYC_EMAIL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                status === s
                  ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                  : "border-border text-muted-foreground hover:border-[var(--gold)]/60"
              }`}
            >
              {KYC_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Applicant name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-border bg-transparent px-3 py-1.5 text-xs text-foreground outline-none focus:border-[var(--gold)]"
            placeholder="Alex Morgan"
          />
        </label>
      </section>

      <section className="mt-4 rounded-xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Subject line
            </p>
            <p className="mt-1 truncate text-sm">
              {preview.data?.subject ?? (preview.isPending ? "Rendering…" : "—")}
            </p>
          </div>
          <div className="flex gap-2">
            {(["rendered", "text"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${
                  view === v
                    ? "border-[var(--gold)] text-[var(--gold)]"
                    : "border-border text-muted-foreground hover:border-[var(--gold)]/60"
                }`}
              >
                {v === "rendered" ? (
                  <>
                    <Eye className="h-3.5 w-3.5" /> Rendered
                  </>
                ) : (
                  <>
                    <Code2 className="h-3.5 w-3.5" /> Plain text
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {preview.error ? (
            <p className="text-xs text-[var(--danger)]">{(preview.error as Error).message}</p>
          ) : preview.isPending ? (
            <p className="text-xs text-muted-foreground">Rendering the email…</p>
          ) : view === "rendered" ? (
            <iframe
              title={`KYC ${KYC_STATUS_LABEL[status]} email preview`}
              srcDoc={preview.data?.html ?? ""}
              className="h-[620px] w-full rounded-lg border border-border bg-white"
            />
          ) : (
            <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap rounded-lg border border-border p-4 text-xs text-muted-foreground">
              {preview.data?.text}
            </pre>
          )}
        </div>
      </section>

      <EmailTemplateEditor status={status} />



      <section className="mt-4 rounded-xl border border-border p-4">
        <p className="text-sm font-medium">Send a test copy</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Delivers the currently selected state to one inbox. Test sends appear in the
          project's email delivery history alongside real sends.
        </p>
        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setNotice(null);
            test.mutate();
          }}
        >
          <input
            type="email"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="you@example.com"
            className="min-w-[240px] flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--gold)]"
          />
          <button
            type="submit"
            disabled={test.isPending || !to}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--gold)]/60 px-4 py-2 text-xs text-[var(--gold)] hover:bg-[var(--gold)]/10 disabled:opacity-50"
          >
            {test.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Send “{KYC_STATUS_LABEL[status]}” test
          </button>
        </form>
        {notice && (
          <p
            aria-live="polite"
            className={`mt-3 text-xs ${notice.tone === "ok" ? "text-[var(--success,#4ade80)]" : "text-[var(--danger)]"}`}
          >
            {notice.text}
          </p>
        )}
      </section>
    </main>
  );
}
