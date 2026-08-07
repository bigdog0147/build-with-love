import { describe, expect, it } from "vitest";
import type { RaiseHistoryEvent } from "@/lib/raise-history";
import {
  bulkConfirmationsFileName,
  buildBulkRaiseConfirmations,
  downloadableRaiseEvents,
} from "@/lib/raise-confirmations-bulk";
import { buildZipArchive, crc32, uniqueZipNames } from "@/lib/zip-archive";

function event(overrides: Partial<RaiseHistoryEvent> = {}): RaiseHistoryEvent {
  return {
    key: "accepted",
    label: "Allocation accepted",
    detail: "Your allocation was accepted by the desk.",
    at: "2026-05-01T10:00:00.000Z",
    actor: "Capital markets desk",
    tone: "success",
    downloadable: true,
    reference: "REF-1",
    amount: 250000,
    note: "Wire instructions issued.",
    ...overrides,
  } as RaiseHistoryEvent;
}

const base = { roundName: "Series C Expansion", currency: "USD", investorName: "Ada Obi" };

describe("zip-archive", () => {
  it("computes a known CRC32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("writes local, central and end-of-directory signatures", () => {
    const bytes = buildZipArchive([
      { name: "a.txt", bytes: new TextEncoder().encode("hello") },
      { name: "b.txt", bytes: new TextEncoder().encode("world") },
    ]);
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    const end = bytes.length - 22;
    expect(new DataView(bytes.buffer).getUint32(end, true)).toBe(0x06054b50);
    expect(new DataView(bytes.buffer).getUint16(end + 10, true)).toBe(2);
    expect(new TextDecoder().decode(bytes)).toContain("a.txt");
  });

  it("de-duplicates and sanitises entry names", () => {
    expect(uniqueZipNames(["a.pdf", "a.pdf", "b/c.pdf"])).toEqual([
      "a.pdf",
      "a (2).pdf",
      "b-c.pdf",
    ]);
  });
});

describe("buildBulkRaiseConfirmations", () => {
  it("returns null when nothing is downloadable", () => {
    expect(
      buildBulkRaiseConfirmations({ ...base, events: [event({ downloadable: false })] }),
    ).toBeNull();
    expect(downloadableRaiseEvents([event({ downloadable: false }), event()])).toHaveLength(1);
  });

  it("bundles one PDF per downloadable event", () => {
    const bundle = buildBulkRaiseConfirmations({
      ...base,
      events: [event(), event({ key: "funded", label: "Funds received", reference: "REF-2" })],
    });
    expect(bundle).not.toBeNull();
    expect(bundle!.count).toBe(2);
    const text = new TextDecoder().decode(bundle!.bytes);
    expect(text.startsWith("PK\u0003\u0004")).toBe(true);
    expect(text).toContain(".pdf");
    expect(bundle!.bytes.length).toBeGreaterThan(1000);
  });

  it("names the archive after the round and date", () => {
    expect(bulkConfirmationsFileName("Series C Expansion", new Date("2026-05-02T00:00:00Z"))).toBe(
      "gf3x-confirmations-series-c-expansion-2026-05-02.zip",
    );
  });
});
