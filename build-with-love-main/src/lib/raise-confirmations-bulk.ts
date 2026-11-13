import type { RaiseHistoryEvent } from "@/lib/raise-history";
import { buildRaiseConfirmationPdf } from "@/lib/raise-confirmation";
import { buildZipArchive, type ZipEntry } from "@/lib/zip-archive";

export type BulkConfirmationInput = {
  events: RaiseHistoryEvent[];
  roundName: string;
  currency: string;
  investorName: string;
  generatedAt?: string;
};

/** Only events that carry a confirmation document can be bundled. */
export function downloadableRaiseEvents(events: RaiseHistoryEvent[]): RaiseHistoryEvent[] {
  return events.filter((event) => event.downloadable);
}

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "capital-raise"
  );
}

export function bulkConfirmationsFileName(roundName: string, at: Date = new Date()): string {
  const day = at.toISOString().slice(0, 10);
  return `gf3x-confirmations-${slug(roundName)}-${day}.zip`;
}

/**
 * Bundles every confirmation document for a round into a single ZIP archive.
 * Returns null when the round has no downloadable events.
 */
export function buildBulkRaiseConfirmations(
  input: BulkConfirmationInput,
): { fileName: string; bytes: Uint8Array; count: number } | null {
  const events = downloadableRaiseEvents(input.events);
  if (events.length === 0) return null;

  const entries: ZipEntry[] = events.map((event) => {
    const { fileName, bytes } = buildRaiseConfirmationPdf({
      kind: event.key,
      reference: event.reference ?? event.key,
      roundName: input.roundName,
      currency: input.currency,
      investorName: input.investorName,
      amount: event.amount ?? null,
      decidedAt: event.at,
      actor: event.actor,
      headline: event.label,
      detail: event.detail,
      note: event.note ?? null,
      ...(input.generatedAt ? { generatedAt: input.generatedAt } : {}),
    });
    return { name: fileName, bytes };
  });

  return {
    fileName: bulkConfirmationsFileName(input.roundName),
    bytes: buildZipArchive(entries),
    count: entries.length,
  };
}

/** Triggers a browser download of the bundled archive; no-ops on the server. */
export function downloadBulkRaiseConfirmations(input: BulkConfirmationInput): number {
  if (typeof document === "undefined") return 0;
  const bundle = buildBulkRaiseConfirmations(input);
  if (!bundle) return 0;
  const blob = new Blob([bundle.bytes as BlobPart], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = bundle.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return bundle.count;
}
