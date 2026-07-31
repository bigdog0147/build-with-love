import { useState, type ReactNode } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useRegistry, type RegistryRecord } from "@/lib/admin-store";
import { Badge, Button, Column, DataTable, Drawer, Field, Panel, PanelHead, Toggle, cx, inputCx } from "./kit";

export type FieldSpec = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "toggle" | "textarea";
  options?: string[];
  suffix?: string;
  hideInTable?: boolean;
  tone?: (v: string) => "neutral" | "gold" | "success" | "danger" | "electric";
};

/**
 * Full CRUD module: search, filters, sorting, pagination, CSV export,
 * create/edit drawer and delete — driven by a field schema.
 */
export function RegistryModule<T extends RegistryRecord>({
  title,
  sub,
  storeKey,
  seed,
  fields,
  filterKeys = [],
  header,
  createLabel = "New record",
}: {
  title: string;
  sub?: string;
  storeKey: string;
  seed: T[];
  fields: FieldSpec[];
  filterKeys?: string[];
  header?: ReactNode;
  createLabel?: string;
}) {
  const { rows, create, update, remove } = useRegistry<T>(storeKey, seed);
  const [editing, setEditing] = useState<T | "new" | null>(null);

  const blank = Object.fromEntries(
    fields.map((f) => [f.key, f.type === "toggle" ? false : f.type === "number" ? 0 : ""]),
  ) as unknown as T;
  const draftSource = editing === "new" ? blank : editing;
  const [draft, setDraft] = useState<T | null>(null);
  const value = draft ?? draftSource ?? blank;

  function open(row: T | "new") {
    setEditing(row);
    setDraft(row === "new" ? blank : { ...row });
  }

  function save() {
    if (!draft) return;
    if (editing === "new") {
      const { id: _drop, ...rest } = draft as RegistryRecord;
      create(rest as Omit<T, "id">);
    } else if (editing) {
      update(editing.id, draft);
    }
    setEditing(null);
    setDraft(null);
  }

  const columns: Column<T>[] = [
    ...fields
      .filter((f) => !f.hideInTable)
      .map<Column<T>>((f) => ({
        key: f.key,
        label: f.label,
        value: (r) => (r[f.key] as string | number) ?? "",
        render: (r) => {
          const v = r[f.key];
          if (f.type === "toggle") return <Badge tone={v ? "success" : "neutral"}>{v ? "Enabled" : "Off"}</Badge>;
          if (f.type === "select" && f.tone) return <Badge tone={f.tone(String(v))}>{String(v)}</Badge>;
          if (f.type === "number")
            return (
              <span className="tabular-nums">
                {Number(v).toLocaleString("en-US")}
                {f.suffix ? ` ${f.suffix}` : ""}
              </span>
            );
          return <span className="block max-w-64 truncate">{String(v ?? "—")}</span>;
        },
      })),
    {
      key: "actions",
      label: "",
      sortable: false,
      className: "text-right",
      render: (r) => (
        <span className="flex justify-end gap-1.5">
          <button
            onClick={() => open(r)}
            aria-label="Edit record"
            className="rounded-md border border-white/12 p-1.5 hover:border-[var(--gold)]/50"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => remove(r.id)}
            aria-label="Delete record"
            className="rounded-md border border-white/12 p-1.5 text-[var(--danger)] hover:border-[var(--danger)]/50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      ),
    },
  ];

  const filters = filterKeys.map((k) => {
    const spec = fields.find((f) => f.key === k);
    return {
      key: k,
      label: spec?.label ?? k,
      options: spec?.options ?? [...new Set(rows.map((r) => String(r[k])))],
      value: (r: T) => String(r[k]),
    };
  });

  return (
    <>
      {header}
      <Panel>
        <PanelHead
          title={title}
          sub={sub}
          right={
            <Button variant="gold" onClick={() => open("new")}>
              <Plus className="h-3.5 w-3.5" /> {createLabel}
            </Button>
          }
        />
        <DataTable
          rows={rows}
          columns={columns}
          filters={filters}
          exportName={storeKey}
          pageSize={8}
          empty="No records yet — create the first one."
        />
      </Panel>

      <Drawer
        open={editing !== null}
        onClose={() => {
          setEditing(null);
          setDraft(null);
        }}
        title={editing === "new" ? createLabel : "Edit record"}
      >
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              {f.type === "toggle" ? (
                <Toggle
                  label={f.label}
                  checked={Boolean(value[f.key])}
                  onChange={(v) => setDraft({ ...(value as T), [f.key]: v })}
                />
              ) : (
                <Field label={f.label}>
                  {f.type === "select" ? (
                    <select
                      value={String(value[f.key] ?? "")}
                      onChange={(e) => setDraft({ ...(value as T), [f.key]: e.target.value })}
                      className={inputCx}
                    >
                      {(f.options ?? []).map((o) => (
                        <option key={o} value={o} className="bg-black">
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={String(value[f.key] ?? "")}
                      onChange={(e) => setDraft({ ...(value as T), [f.key]: e.target.value })}
                      className={cx(inputCx, "resize-y")}
                    />
                  ) : (
                    <input
                      type={f.type === "number" ? "number" : "text"}
                      value={String(value[f.key] ?? "")}
                      onChange={(e) =>
                        setDraft({
                          ...(value as T),
                          [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                        })
                      }
                      className={inputCx}
                    />
                  )}
                </Field>
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button variant="gold" onClick={save} className="flex-1">
              Save record
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(null);
                setDraft(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
}
