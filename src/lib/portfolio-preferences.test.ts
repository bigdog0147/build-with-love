import { describe, expect, it } from "vitest";
import {
  DEFAULT_PORTFOLIO_RANGE,
  PORTFOLIO_RANGE_STORAGE_KEY,
  parseRange,
  readStoredRange,
  writeStoredRange,
} from "./portfolio-preferences";

function memoryStore(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    map,
  };
}

describe("parseRange", () => {
  it("accepts every supported range", () => {
    for (const key of ["1M", "3M", "6M", "YTD", "1Y", "ALL"]) {
      expect(parseRange(key)).toBe(key);
    }
  });

  it("falls back for unknown, empty or non-string values", () => {
    expect(parseRange("2W")).toBe(DEFAULT_PORTFOLIO_RANGE);
    expect(parseRange(null)).toBe(DEFAULT_PORTFOLIO_RANGE);
    expect(parseRange(undefined)).toBe(DEFAULT_PORTFOLIO_RANGE);
    expect(parseRange(12)).toBe(DEFAULT_PORTFOLIO_RANGE);
    expect(parseRange("all")).toBe(DEFAULT_PORTFOLIO_RANGE);
    expect(parseRange("2W", "1Y")).toBe("1Y");
  });
});

describe("stored range round-trip", () => {
  it("reads back what was written", () => {
    const store = memoryStore();
    writeStoredRange("1Y", store);
    expect(store.map.get(PORTFOLIO_RANGE_STORAGE_KEY)).toBe("1Y");
    expect(readStoredRange(store)).toBe("1Y");
  });

  it("defaults when nothing is stored or storage is unavailable", () => {
    expect(readStoredRange(memoryStore())).toBe(DEFAULT_PORTFOLIO_RANGE);
    expect(readStoredRange(null)).toBe(DEFAULT_PORTFOLIO_RANGE);
  });

  it("ignores corrupted stored values", () => {
    expect(readStoredRange(memoryStore({ [PORTFOLIO_RANGE_STORAGE_KEY]: "{}" }))).toBe(DEFAULT_PORTFOLIO_RANGE);
  });

  it("never throws when storage rejects writes", () => {
    const hostile = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(() => writeStoredRange("3M", hostile)).not.toThrow();
    expect(readStoredRange(hostile)).toBe(DEFAULT_PORTFOLIO_RANGE);
  });
});
