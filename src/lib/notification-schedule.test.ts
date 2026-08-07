import { describe, expect, it } from "vitest";
import {
  inQuietHours,
  nextLocalHour,
  nextWeeklySlot,
  normalizeDigest,
  normalizeHour,
  safeTimeZone,
  scheduleDelivery,
} from "./notification-schedule";

const utc = (iso: string) => new Date(iso);

describe("normalisers", () => {
  it("falls back on invalid hours", () => {
    expect(normalizeHour(5, 8)).toBe(5);
    expect(normalizeHour(-1, 8)).toBe(8);
    expect(normalizeHour(24, 8)).toBe(8);
    expect(normalizeHour(3.5, 8)).toBe(8);
    expect(normalizeHour("nope", 21)).toBe(21);
  });
  it("normalises digest modes and time zones", () => {
    expect(normalizeDigest("weekly")).toBe("weekly");
    expect(normalizeDigest("monthly")).toBe("instant");
    expect(safeTimeZone("Europe/Berlin")).toBe("Europe/Berlin");
    expect(safeTimeZone("Mars/Olympus")).toBe("UTC");
    expect(safeTimeZone("")).toBe("UTC");
  });
});

describe("inQuietHours", () => {
  const w = { quiet_hours_enabled: true, quiet_hours_start: 21, quiet_hours_end: 7, time_zone: "UTC" };
  it("wraps midnight", () => {
    expect(inQuietHours(utc("2026-01-05T22:00:00Z"), w)).toBe(true);
    expect(inQuietHours(utc("2026-01-05T03:00:00Z"), w)).toBe(true);
    expect(inQuietHours(utc("2026-01-05T12:00:00Z"), w)).toBe(false);
  });
  it("respects the customer time zone", () => {
    const lagos = { ...w, time_zone: "Africa/Lagos" };
    expect(inQuietHours(utc("2026-01-05T20:30:00Z"), lagos)).toBe(true); // 21:30 local
    expect(inQuietHours(utc("2026-01-05T19:30:00Z"), lagos)).toBe(false); // 20:30 local
  });
  it("is off when disabled or degenerate", () => {
    expect(inQuietHours(utc("2026-01-05T22:00:00Z"), { ...w, quiet_hours_enabled: false })).toBe(false);
    expect(inQuietHours(utc("2026-01-05T22:00:00Z"), { ...w, quiet_hours_start: 7 })).toBe(false);
  });
});

describe("slots", () => {
  it("finds the next local hour", () => {
    expect(nextLocalHour(utc("2026-01-05T22:30:00Z"), "UTC", 7).toISOString()).toBe("2026-01-06T07:00:00.000Z");
    expect(nextLocalHour(utc("2026-01-05T06:00:00Z"), "UTC", 8).toISOString()).toBe("2026-01-05T08:00:00.000Z");
  });
  it("finds the next Monday slot", () => {
    const slot = nextWeeklySlot(utc("2026-01-07T10:00:00Z"), "UTC", 8); // Wed
    expect(slot.toISOString()).toBe("2026-01-12T08:00:00.000Z");
  });
});

describe("scheduleDelivery", () => {
  it("sends immediately outside quiet hours with instant cadence", () => {
    expect(scheduleDelivery("raise", { time_zone: "UTC" }, utc("2026-01-05T12:00:00Z"))).toEqual({
      mode: "immediate",
    });
  });
  it("defers during quiet hours until they end", () => {
    const d = scheduleDelivery(
      "raise",
      { quiet_hours_enabled: true, quiet_hours_start: 21, quiet_hours_end: 7, time_zone: "UTC" },
      utc("2026-01-05T23:00:00Z"),
    );
    expect(d).toMatchObject({ mode: "deferred", reason: "quiet_hours" });
  });
  it("batches raise alerts into a daily digest", () => {
    const d = scheduleDelivery("raise", { raise_digest: "daily", digest_hour: 8, time_zone: "UTC" }, utc("2026-01-05T12:00:00Z"));
    expect(d).toMatchObject({ mode: "deferred", reason: "daily_digest" });
  });
  it("only applies the raise digest to raise alerts", () => {
    const d = scheduleDelivery("kyc", { raise_digest: "weekly", time_zone: "UTC" }, utc("2026-01-05T12:00:00Z"));
    expect(d.mode).toBe("immediate");
  });
});
