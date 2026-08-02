import { describe, expect, it } from "vitest";
import {
  applySpread,
  convert,
  formatMoney,
  fromFrankfurter,
  isStale,
  toRateMap,
  toUsd,
} from "./fx";

const rates = toRateMap([
  { code: "EUR", rate_to_usd: 1.08 },
  { code: "gbp", rate_to_usd: 1.27 },
  { code: "BAD", rate_to_usd: 0 },
]);

describe("toRateMap", () => {
  it("always includes USD at parity and upper-cases codes", () => {
    expect(rates.USD).toBe(1);
    expect(rates.GBP).toBe(1.27);
  });

  it("drops non-positive rates", () => {
    expect(rates.BAD).toBeUndefined();
  });
});

describe("toUsd", () => {
  it("converts a foreign balance to USD", () => {
    expect(toUsd(100, "EUR", rates)).toBe(108);
  });

  it("returns null for unknown currencies", () => {
    expect(toUsd(100, "ZWL", rates)).toBeNull();
  });
});

describe("convert", () => {
  it("goes through the USD base", () => {
    const result = convert(100, "EUR", "GBP", rates);
    expect(result?.rate).toBeCloseTo(1.08 / 1.27, 6);
    expect(result?.amount).toBeCloseTo(85.03937, 4);
  });

  it("is identity for the same currency", () => {
    expect(convert(50, "EUR", "EUR", rates)).toEqual({ amount: 50, rate: 1 });
  });

  it("returns null when either side is unknown", () => {
    expect(convert(50, "EUR", "ZWL", rates)).toBeNull();
  });
});

describe("applySpread", () => {
  it("reduces the amount by the spread", () => {
    expect(applySpread(100, 0.5)).toBe(99.5);
  });

  it("ignores negative or invalid spreads", () => {
    expect(applySpread(100, -5)).toBe(100);
    expect(applySpread(100, Number.NaN)).toBe(100);
  });
});

describe("fromFrankfurter", () => {
  it("inverts per-USD quotes into USD values", () => {
    const map = fromFrankfurter({ base: "USD", rates: { EUR: 0.92, JPY: 155 } });
    expect(map.USD).toBe(1);
    expect(map.EUR).toBeCloseTo(1.0869565, 5);
    expect(map.JPY).toBeCloseTo(0.0064516, 6);
  });

  it("tolerates an empty payload", () => {
    expect(fromFrankfurter({})).toEqual({ USD: 1 });
  });
});

describe("isStale", () => {
  const now = new Date("2026-01-01T12:00:00Z").getTime();
  it("treats missing timestamps as stale", () => {
    expect(isStale(null, now)).toBe(true);
  });
  it("accepts a recent refresh", () => {
    expect(isStale("2026-01-01T11:00:00Z", now)).toBe(false);
  });
  it("flags an old refresh", () => {
    expect(isStale("2026-01-01T06:00:00Z", now)).toBe(true);
  });
});

describe("formatMoney", () => {
  it("respects the currency decimals", () => {
    expect(formatMoney(1234.5, "JPY", "en", 0)).toContain("1,235");
  });
  it("falls back for invalid codes", () => {
    expect(formatMoney(10, "NOTACODE", "en")).toBe("10.00 NOTACODE");
  });
});
