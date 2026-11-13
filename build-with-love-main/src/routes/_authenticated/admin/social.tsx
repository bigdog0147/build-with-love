import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { SocialIcon } from "@/components/social-icon";
import {
  listAllSocialLinks,
  saveSocialLink,
  deleteSocialLink,
  getAdminStatus,
} from "@/lib/social.functions";
import { ICON_KEYS, type SocialLink } from "@/lib/social.types";

export const Route = createFileRoute("/_authenticated/admin/social")({
  component: SocialAdminPage,
  head: () => ({
    meta: [
      { title: "Social Media Control — Gigafactory 3X Admin" },
      {
        name: "description",
        content: "Administration control for the company's social media profiles.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function SocialAdminPage() {
  const fetchAdmin = useServerFn(getAdminStatus);
  const fetchLinks = useServerFn(listAllSocialLinks);

  const admin = useQuery({ queryKey: ["admin-status"], queryFn: () => fetchAdmin({}) });
  const links = useQuery({
    queryKey: ["social-links", "admin"],
    queryFn: () => fetchLinks({}),
    enabled: admin.data?.isAdmin === true,
  });

  if (admin.isLoading) {
    return <Shell><p className="text-sm text-muted-foreground">Checking permissions…</p></Shell>;
  }

  if (!admin.data?.isAdmin) {
    return (
      <Shell>
        <div className="rounded-2xl border border-border p-8" style={{ background: "var(--gradient-surface)" }}>
          <h2 className="font-display text-xl">Admin access required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account does not have the administrator role, so the social media
            control is read-only for you. Ask an existing administrator to grant
            your account the admin role.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {links.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading profiles…</p>
      ) : (
        <SocialEditor rows={links.data ?? []} />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>
        <h1 className="mt-6 font-display text-3xl">Social Media Control</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Store the company's social media presence here. Profiles marked visible
          with a valid URL appear in the public website footer.
        </p>
        <div className="mt-8 space-y-4">{children}</div>
      </div>
    </div>
  );
}

const BLANK: SocialLink = {
  id: "",
  network: "",
  label: "",
  url: "",
  handle: "",
  icon_key: "link",
  is_visible: false,
  sort_order: 99,
};

function SocialEditor({ rows }: { rows: SocialLink[] }) {
  const qc = useQueryClient();
  const save = useServerFn(saveSocialLink);
  const remove = useServerFn(deleteSocialLink);
  const [drafts, setDrafts] = useState<SocialLink[]>(rows);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => setDrafts(rows), [rows]);

  const saveMutation = useMutation({
    mutationFn: (row: SocialLink) =>
      save({
        data: {
          id: row.id || undefined,
          network: row.network,
          label: row.label,
          url: row.url,
          handle: row.handle,
          icon_key: row.icon_key,
          is_visible: row.is_visible,
          sort_order: row.sort_order,
        },
      }),
    onSuccess: (saved) => {
      setError(null);
      setSavedId(saved.id);
      qc.invalidateQueries({ queryKey: ["social-links"] });
      setTimeout(() => setSavedId(null), 2000);
    },
    onError: (e: unknown) =>
      setError(e instanceof Error ? e.message : "Could not save this profile"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-links"] }),
    onError: (e: unknown) =>
      setError(e instanceof Error ? e.message : "Could not delete this profile"),
  });

  function update(index: number, patch: Partial<SocialLink>) {
    setDrafts((d) => d.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <>
      {error && (
        <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
          {error}
        </div>
      )}

      {drafts.map((row, i) => (
        <div
          key={row.id || `new-${i}`}
          className="rounded-2xl border border-border p-5"
          style={{ background: "var(--gradient-surface)" }}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-border text-[var(--gold)]">
              <SocialIcon iconKey={row.icon_key} />
            </span>
            <input
              value={row.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Display name"
              className="flex-1 rounded-lg border border-border bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]/60"
            />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={row.is_visible}
                onChange={(e) => update(i, { is_visible: e.target.checked })}
              />
              Visible
            </label>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <FieldInput
              label="Network key"
              value={row.network}
              onChange={(v) => update(i, { network: v })}
              placeholder="linkedin"
            />
            <FieldInput
              label="Handle (optional)"
              value={row.handle ?? ""}
              onChange={(v) => update(i, { handle: v })}
              placeholder="@gigafactory3"
            />
            <div className="md:col-span-2">
              <FieldInput
                label="Profile URL"
                value={row.url}
                onChange={(v) => update(i, { url: v })}
                placeholder="https://www.linkedin.com/company/gigafactory3"
              />
            </div>
            <label className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
                Icon
              </span>
              <select
                value={row.icon_key}
                onChange={(e) => update(i, { icon_key: e.target.value })}
                className="w-full rounded-lg border border-border bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]/60"
              >
                {ICON_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
            <FieldInput
              label="Order"
              value={String(row.sort_order)}
              onChange={(v) => update(i, { sort_order: Number(v) || 0 })}
              placeholder="10"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => saveMutation.mutate(row)}
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
              style={{ background: "var(--gradient-gold)" }}
            >
              <Save className="h-4 w-4" />
              Save
            </button>
            {row.id && (
              <button
                onClick={() => deleteMutation.mutate(row.id)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-[var(--danger)]"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
            {savedId && savedId === row.id && (
              <span className="text-xs text-[var(--success)]">Saved</span>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={() => setDrafts((d) => [...d, { ...BLANK }])}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-[var(--gold)]/60"
      >
        <Plus className="h-4 w-4" />
        Add another network
      </button>
    </>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]/60"
      />
    </label>
  );
}
