import { useCallback, useEffect, useState } from "react";

/**
 * Operational registries for console modules that are configured by the
 * administrator (programs, assets, campaigns, integration config…).
 * Records persist per browser profile until a backend table is provisioned.
 */
const PREFIX = "gf3x.admin.";

export type RegistryRecord = { id: string } & Record<string, string | number | boolean>;

function read<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return seed;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : seed;
  } catch {
    return seed;
  }
}

export function useRegistry<T extends RegistryRecord>(key: string, seed: T[]) {
  const [rows, setRows] = useState<T[]>(() => read(key, seed));

  useEffect(() => {
    setRows(read(key, seed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const persist = useCallback(
    (next: T[]) => {
      setRows(next);
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
    },
    [key],
  );

  const create = useCallback(
    (row: Omit<T, "id">) => persist([{ ...row, id: crypto.randomUUID() } as T, ...rows]),
    [persist, rows],
  );
  const update = useCallback(
    (id: string, patch: Partial<T>) => persist(rows.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    [persist, rows],
  );
  const remove = useCallback((id: string) => persist(rows.filter((r) => r.id !== id)), [persist, rows]);
  const reset = useCallback(() => {
    window.localStorage.removeItem(PREFIX + key);
    setRows(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, seed]);

  return { rows, create, update, remove, reset, setAll: persist };
}

export function useSettings<T extends Record<string, string | number | boolean>>(key: string, seed: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return seed;
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw ? { ...seed, ...(JSON.parse(raw) as T) } : seed;
    } catch {
      return seed;
    }
  });
  const patch = useCallback(
    (p: Partial<T>) => {
      setValue((v) => {
        const next = { ...v, ...p };
        try {
          window.localStorage.setItem(PREFIX + key, JSON.stringify(next));
        } catch {
          /* storage unavailable */
        }
        return next;
      });
    },
    [key],
  );
  return [value, patch] as const;
}
