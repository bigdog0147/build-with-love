/**
 * Encoding for skip reasons written to the dispatch audit log.
 *
 * The machine-readable code stays first so existing filters and tests keep
 * matching (e.g. "event_opted_out"); optional context is appended as
 * `key=value` pairs so the audit viewer can show which raise event was muted
 * and which preference switched it off.
 */

export type SkipReasonDetail = {
  code: string;
  /** Raise timeline event id that produced the notice, when known. */
  event?: string | null;
  /** Preference column (or preference table) that caused the skip. */
  source?: string | null;
};

export function encodeSkipReason(input: SkipReasonDetail): string {
  const parts = [input.code];
  if (input.event) parts.push(`event=${input.event}`);
  if (input.source) parts.push(`source=${input.source}`);
  return parts.join(" · ");
}

export function parseSkipReason(detail: string | null | undefined): SkipReasonDetail | null {
  if (!detail) return null;
  const segments = detail.split("·").map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) return null;
  const [code, ...rest] = segments;
  const result: SkipReasonDetail = { code };
  for (const segment of rest) {
    const [key, ...value] = segment.split("=");
    const raw = value.join("=").trim();
    if (!raw) continue;
    if (key.trim() === "event") result.event = raw;
    if (key.trim() === "source") result.source = raw;
  }
  return result;
}
