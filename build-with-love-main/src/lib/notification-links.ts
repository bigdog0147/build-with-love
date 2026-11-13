/**
 * Pure helpers for the customer notification centre: resolving a notification
 * back to the capital raising round it refers to, and paginating the merged feed.
 */

export type RoundRef = { id: string; name: string };

/** Longest-name-first so "Series B Extension" wins over "Series B". */
export function resolveRoundId(text: string, rounds: RoundRef[]): string | null {
  const haystack = text.toLowerCase();
  const sorted = [...rounds]
    .filter((r) => r.name && r.name.trim().length >= 3)
    .sort((a, b) => b.name.length - a.name.length);
  for (const round of sorted) {
    if (haystack.includes(round.name.trim().toLowerCase())) return round.id;
  }
  return null;
}

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

export function paginate<T>(items: T[], page: number, pageSize: number): PageResult<T> {
  const size = Math.max(1, Math.floor(pageSize) || 1);
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (current - 1) * size;
  return {
    items: items.slice(start, start + size),
    page: current,
    pageSize: size,
    total: items.length,
    pageCount,
  };
}
