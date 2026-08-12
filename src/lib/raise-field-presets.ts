/**
 * Saved field-change filter presets for the raise history timeline.
 * Presets are a per-browser convenience, stored in localStorage.
 */

export type RaiseFieldPreset = {
  id: string;
  name: string;
  fields: string[];
  createdAt: string;
};

const STORAGE_KEY = "gf3x.raise-history.field-presets.v1";

export function normalizePresetFields(fields: readonly string[]): string[] {
  return Array.from(new Set(fields.map((f) => f.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function presetFieldsMatch(a: readonly string[], b: readonly string[]): boolean {
  const left = normalizePresetFields(a);
  const right = normalizePresetFields(b);
  return left.length === right.length && left.every((f, i) => f === right[i]);
}

function isPreset(value: unknown): value is RaiseFieldPreset {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p['id'] === "string" &&
    typeof p['name'] === "string" &&
    Array.isArray(p['fields']) &&
    (p['fields'] as unknown[]).every((f) => typeof f === "string")
  );
}

export function parseRaiseFieldPresets(raw: string | null): RaiseFieldPreset[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPreset).map((p) => ({
      id: p.id,
      name: p.name,
      fields: normalizePresetFields(p.fields),
      createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date(0).toISOString(),
    }));
  } catch {
    return [];
  }
}

export function loadRaiseFieldPresets(): RaiseFieldPreset[] {
  if (typeof window === "undefined") return [];
  try {
    return parseRaiseFieldPresets(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveRaiseFieldPresets(presets: readonly RaiseFieldPreset[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    /* storage unavailable (private mode / quota) — presets stay session-only */
  }
}

export function upsertRaiseFieldPreset(
  presets: readonly RaiseFieldPreset[],
  input: { name: string; fields: readonly string[] },
): { presets: RaiseFieldPreset[]; preset: RaiseFieldPreset; replaced: boolean } {
  const name = input.name.trim().slice(0, 48);
  const fields = normalizePresetFields(input.fields);
  const existing = presets.find((p) => p.name.toLowerCase() === name.toLowerCase());
  const preset: RaiseFieldPreset = {
    id: existing?.id ?? `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    fields,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  const next = existing
    ? presets.map((p) => (p.id === existing.id ? preset : p))
    : [...presets, preset];
  return {
    presets: [...next].sort((a, b) => a.name.localeCompare(b.name)),
    preset,
    replaced: Boolean(existing),
  };
}

export function removeRaiseFieldPreset(
  presets: readonly RaiseFieldPreset[],
  id: string,
): RaiseFieldPreset[] {
  return presets.filter((p) => p.id !== id);
}

export function presetSummary(preset: RaiseFieldPreset): string {
  if (preset.fields.length === 0) return "Any field";
  return preset.fields.join(", ");
}
