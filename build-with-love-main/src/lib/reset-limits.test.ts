import { describe, expect, it } from "vitest";
import {
  RESET_LIMIT_DEFAULTS,
  parseResetLimitValue,
  parseResetLimits,
  type ResetLimitKey,
} from "./reset-limits";

describe("parseResetLimitValue", () => {
  const FALLBACK = 42;

  it("returns fallback for undefined / null / empty string", () => {
    expect(parseResetLimitValue(undefined, FALLBACK)).toBe(FALLBACK);
    expect(parseResetLimitValue(null, FALLBACK)).toBe(FALLBACK);
    expect(parseResetLimitValue("", FALLBACK)).toBe(FALLBACK);
    expect(parseResetLimitValue("   ", FALLBACK)).toBe(FALLBACK);
  });

  it("returns fallback for non-integer numeric strings", () => {
    expect(parseResetLimitValue("1.5", FALLBACK)).toBe(FALLBACK);
    expect(parseResetLimitValue("0.1", FALLBACK)).toBe(FALLBACK);
    expect(parseResetLimitValue("1e3", FALLBACK)).toBe(FALLBACK);
    expect(parseResetLimitValue("0x10", FALLBACK)).toBe(FALLBACK);
    expect(parseResetLimitValue(".5", FALLBACK)).toBe(FALLBACK);
    expect(parseResetLimitValue("3.", FALLBACK)).toBe(FALLBACK);
  });

  it("returns fallback for non-numeric junk", () => {
    expect(parseResetLimitValue("abc", FALLBACK)).toBe(FALLBACK);
    expect(parseResetLimitValue("12abc", FALLBACK)).toBe(FALLBACK);
    expect(parseResetLimitValue("NaN", FALLBACK)).toBe(FALLBACK);
    expect(parseResetLimitValue("Infinity", FALLBACK)).toBe(FALLBACK);
    expect(parseResetLimitValue("-Infinity", FALLBACK)).toBe(FALLBACK);
  });

  it("returns fallback for negative integers", () => {
    expect(parseResetLimitValue("-1", FALLBACK)).toBe(FALLBACK);
    expect(parseResetLimitValue("-100", FALLBACK)).toBe(FALLBACK);
  });

  it("returns fallback for zero", () => {
    expect(parseResetLimitValue("0", FALLBACK)).toBe(FALLBACK);
    expect(parseResetLimitValue("-0", FALLBACK)).toBe(FALLBACK);
  });

  it("accepts valid positive integers", () => {
    expect(parseResetLimitValue("1", FALLBACK)).toBe(1);
    expect(parseResetLimitValue("10", FALLBACK)).toBe(10);
    expect(parseResetLimitValue("  25  ", FALLBACK)).toBe(25);
    expect(parseResetLimitValue("999999", FALLBACK)).toBe(999999);
  });
});

describe("parseResetLimits", () => {
  it("returns all defaults when env is empty", () => {
    expect(parseResetLimits({})).toEqual(RESET_LIMIT_DEFAULTS);
  });

  it("returns all defaults when env is omitted", () => {
    expect(parseResetLimits()).toEqual(RESET_LIMIT_DEFAULTS);
  });

  it("falls back per-key for non-integer values", () => {
    const result = parseResetLimits({
      RESET_LIMIT_MAX_ATTEMPTS: "3.7",
      RESET_LIMIT_WINDOW_SECONDS: "abc",
      RESET_LIMIT_COOLDOWN_SECONDS: "120",
    });
    expect(result.RESET_LIMIT_MAX_ATTEMPTS).toBe(
      RESET_LIMIT_DEFAULTS.RESET_LIMIT_MAX_ATTEMPTS,
    );
    expect(result.RESET_LIMIT_WINDOW_SECONDS).toBe(
      RESET_LIMIT_DEFAULTS.RESET_LIMIT_WINDOW_SECONDS,
    );
    expect(result.RESET_LIMIT_COOLDOWN_SECONDS).toBe(120);
  });

  it("falls back per-key for negative and zero values", () => {
    const result = parseResetLimits({
      RESET_LIMIT_MAX_ATTEMPTS: "-5",
      RESET_LIMIT_WINDOW_SECONDS: "0",
      RESET_LIMIT_COOLDOWN_SECONDS: "-1",
    });
    expect(result).toEqual(RESET_LIMIT_DEFAULTS);
  });

  it("accepts a fully-valid env override", () => {
    const result = parseResetLimits({
      RESET_LIMIT_MAX_ATTEMPTS: "10",
      RESET_LIMIT_WINDOW_SECONDS: "300",
      RESET_LIMIT_COOLDOWN_SECONDS: "7200",
    });
    expect(result).toEqual({
      RESET_LIMIT_MAX_ATTEMPTS: 10,
      RESET_LIMIT_WINDOW_SECONDS: 300,
      RESET_LIMIT_COOLDOWN_SECONDS: 7200,
    });
  });

  it("returns a value for every RESET_LIMIT_* key", () => {
    const keys = Object.keys(RESET_LIMIT_DEFAULTS) as ResetLimitKey[];
    const result = parseResetLimits({});
    for (const k of keys) {
      expect(result[k]).toBeGreaterThan(0);
      expect(Number.isInteger(result[k])).toBe(true);
    }
  });
});
