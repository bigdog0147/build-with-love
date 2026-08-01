import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Loader2, PenLine, RotateCcw, Save, Undo2 } from "lucide-react";
import {
  activateEmailTemplateVersion,
  getEmailTemplateEditorState,
  revertToBuiltInTemplate,
  saveEmailTemplateVersion,
} from "@/lib/email-template-editor.functions";
import { KYC_STATUS_LABEL, type KycEmailStatus } from "@/lib/email-preview.functions";
import {
  validateTemplateDraft,
  type ValidationIssue,
} from "@/lib/email-template-validation";

type Notice = { tone: "ok" | "error"; text: string } | null;
type FieldErrors = Partial<Record<ValidationIssue["field"], string[]>>;

function groupIssues(issues: ValidationIssue[]): FieldErrors {
  const grouped: FieldErrors = {};
  for (const issue of issues) {
    (grouped[issue.field] ??= []).push(issue.message);
  }
  return grouped;
}

/** Inline, field-level error list rendered under the offending input. */
function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <ul id={id} className="mt-1.5 space-y-1 text-[11px] text-[var(--danger)]">
      {messages.map((m) => (
        <li key={m}>{m}</li>
      ))}
    </ul>
  );
}

export function EmailTemplateEditor({ status }: { status: KycEmailStatus }) {
  const qc = useQueryClient();
  const loadState = useServerFn(getEmailTemplateEditorState);
  const saveVersion = useServerFn(saveEmailTemplateVersion);
  const activateVersion = useServerFn(activateEmailTemplateVersion);
  const revertBuiltIn = useServerFn(revertToBuiltInTemplate);

  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [tab, setTab] = useState<"html" | "text">("html");

  const state = useQuery({
    queryKey: ["kyc-email-editor", status],
    queryFn: () => loadState({ data: { status } }),
    retry: false,
  });

  // Load the currently effective content into the editor whenever it changes.
  useEffect(() => {
    if (!state.data) return;
    setSubject(state.data.subject);
    setHtml(state.data.html);
    setText(state.data.text);
    setNote("");
    setFieldErrors({});
  }, [state.data]);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["kyc-email-editor", status] });
    await qc.invalidateQueries({ queryKey: ["kyc-email-preview"] });
  };

  /** Focus the tab holding the first rejected body so its error is visible. */
  const focusFirstBadField = (grouped: FieldErrors) => {
    if (grouped.html?.length) setTab("html");
    else if (grouped.text?.length) setTab("text");
  };

  const save = useMutation({
    mutationFn: () => saveVersion({ data: { status, subject, html, text, note } }),
    onSuccess: async (res) => {
      if (!res.ok) {
        const grouped = groupIssues(res.issues);
        setFieldErrors(grouped);
        focusFirstBadField(grouped);
        setNotice({
          tone: "error",
          text: `This template was not saved — ${res.issues.length} validation ${
            res.issues.length === 1 ? "problem" : "problems"
          } need fixing below.`,
        });
        return;
      }
      setFieldErrors({});
      setNotice({ tone: "ok", text: `Saved as version ${res.version} and now live.` });
      await refresh();
    },
    onError: (err) => setNotice({ tone: "error", text: (err as Error).message }),
  });


  const rollback = useMutation({
    mutationFn: (versionId: string) => activateVersion({ data: { status, versionId } }),
    onSuccess: async () => {
      setNotice({ tone: "ok", text: "Version restored — it is now the live content." });
      await refresh();
    },
    onError: (err) => setNotice({ tone: "error", text: (err as Error).message }),
  });

  const revert = useMutation({
    mutationFn: () => revertBuiltIn({ data: { status } }),
    onSuccess: async () => {
      setNotice({ tone: "ok", text: "Reverted to the built-in template." });
      await refresh();
    },
    onError: (err) => setNotice({ tone: "error", text: (err as Error).message }),
  });

  const dirty =
    !!state.data &&
    (subject !== state.data.subject || html !== state.data.html || text !== state.data.text);

  return (
    <section className="mt-4 rounded-xl border border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium">
            <PenLine className="h-4 w-4 text-[var(--gold)]" /> Edit “{KYC_STATUS_LABEL[status]}”
            content
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Placeholders: <code>{"{{name}}"}</code>, <code>{"{{status_label}}"}</code>. Saving
            creates a new version and makes it live for real sends.
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground">
          {state.data
            ? state.data.source === "custom"
              ? `Live: custom v${state.data.activeVersion}`
              : "Live: built-in template"
            : "Loading…"}
        </span>
      </div>

      {state.error ? (
        <p className="p-4 text-xs text-[var(--danger)]">{(state.error as Error).message}</p>
      ) : state.isPending ? (
        <p className="p-4 text-xs text-muted-foreground">Loading the editor…</p>
      ) : (
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-xs text-muted-foreground" htmlFor="tpl-subject">
              Subject line
            </label>
            <input
              id="tpl-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              aria-invalid={!!fieldErrors.subject?.length}
              aria-describedby={fieldErrors.subject?.length ? "tpl-subject-error" : undefined}
              className={`mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--gold)] ${
                fieldErrors.subject?.length ? "border-[var(--danger)]" : "border-border"
              }`}
            />
            <FieldError id="tpl-subject-error" messages={fieldErrors.subject} />
          </div>

          <div className="flex gap-2">
            {(["html", "text"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  tab === t
                    ? "border-[var(--gold)] text-[var(--gold)]"
                    : "border-border text-muted-foreground hover:border-[var(--gold)]/60"
                } ${fieldErrors[t]?.length ? "ring-1 ring-[var(--danger)]" : ""}`}
              >
                {t === "html" ? "HTML body" : "Plain-text body"}
                {fieldErrors[t]?.length ? (
                  <span className="ml-1.5 text-[var(--danger)]">({fieldErrors[t]!.length})</span>
                ) : null}
              </button>
            ))}
          </div>

          <div>
            <textarea
              key={tab}
              value={tab === "html" ? html : text}
              onChange={(e) => (tab === "html" ? setHtml(e.target.value) : setText(e.target.value))}
              spellCheck={false}
              aria-label={tab === "html" ? "HTML body" : "Plain-text body"}
              aria-invalid={!!fieldErrors[tab]?.length}
              aria-describedby={fieldErrors[tab]?.length ? `tpl-${tab}-error` : undefined}
              className={`h-[380px] w-full rounded-lg border bg-transparent p-3 font-mono text-xs text-foreground outline-none focus:border-[var(--gold)] ${
                fieldErrors[tab]?.length ? "border-[var(--danger)]" : "border-border"
              }`}
            />
            <FieldError id={`tpl-${tab}-error`} messages={fieldErrors[tab]} />
          </div>


          <div className="flex flex-wrap items-center gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Change note (optional)"
              className="min-w-[220px] flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-xs outline-none focus:border-[var(--gold)]"
            />
            <button
              type="button"
              onClick={() => {
                setNotice(null);
                // Mirror the server checks locally for instant field-level feedback;
                // the server remains authoritative.
                const local = validateTemplateDraft({ subject, html, text });
                if (local.length > 0) {
                  const grouped = groupIssues(local);
                  setFieldErrors(grouped);
                  focusFirstBadField(grouped);
                  setNotice({
                    tone: "error",
                    text: `Fix the ${local.length} highlighted ${
                      local.length === 1 ? "problem" : "problems"
                    } before saving.`,
                  });
                  return;
                }
                setFieldErrors({});
                save.mutate();
              }}

              disabled={save.isPending || !dirty}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--gold)]/60 px-4 py-2 text-xs text-[var(--gold)] hover:bg-[var(--gold)]/10 disabled:opacity-50"
            >
              {save.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save new version
            </button>
            <button
              type="button"
              onClick={() => {
                if (!state.data) return;
                setSubject(state.data.builtIn.subject);
                setHtml(state.data.builtIn.html);
                setText(state.data.builtIn.text);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:border-[var(--gold)]/60"
            >
              <Undo2 className="h-3.5 w-3.5" /> Load built-in content
            </button>
            {state.data?.source === "custom" && (
              <button
                type="button"
                onClick={() => {
                  setNotice(null);
                  revert.mutate();
                }}
                disabled={revert.isPending}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:border-[var(--danger)]/60 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Use built-in again
              </button>
            )}
          </div>

          {notice && (
            <p
              aria-live="polite"
              className={`text-xs ${notice.tone === "ok" ? "text-[var(--success,#4ade80)]" : "text-[var(--danger)]"}`}
            >
              {notice.text}
            </p>
          )}

          <div className="rounded-lg border border-border">
            <p className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
              <History className="h-3.5 w-3.5" /> Version history
            </p>
            {state.data && state.data.versions.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted-foreground">
                No saved versions yet — the built-in template is in use.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {state.data?.versions.map((v) => (
                  <li
                    key={v.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
                  >
                    <span className="min-w-0">
                      <span className="text-foreground">v{v.version}</span>{" "}
                      <span className="text-muted-foreground">
                        · {new Date(v.created_at).toLocaleString()}
                        {v.note ? ` · ${v.note}` : ""}
                      </span>
                      {v.is_active && (
                        <span className="ml-2 rounded-full border border-[var(--gold)]/60 px-2 py-0.5 text-[10px] text-[var(--gold)]">
                          Live
                        </span>
                      )}
                    </span>
                    <span className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSubject(v.subject);
                          setHtml(v.html_body);
                          setText(v.text_body);
                          setNotice({
                            tone: "ok",
                            text: `Loaded v${v.version} into the editor — save to make it live.`,
                          });
                        }}
                        className="rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground hover:border-[var(--gold)]/60"
                      >
                        Load
                      </button>
                      {!v.is_active && (
                        <button
                          type="button"
                          onClick={() => {
                            setNotice(null);
                            rollback.mutate(v.id);
                          }}
                          disabled={rollback.isPending}
                          className="rounded-lg border border-[var(--gold)]/60 px-2 py-1 text-[11px] text-[var(--gold)] hover:bg-[var(--gold)]/10 disabled:opacity-50"
                        >
                          Roll back
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
