import { describe, expect, it } from "vitest";
import { paginate, resolveRoundId } from "./notification-links";

const rounds = [
  { id: "r1", name: "Series B" },
  { id: "r2", name: "Series B Extension" },
  { id: "r3", name: "Gigafactory Grid Storage" },
];

describe("resolveRoundId", () => {
  it("matches a round name inside notification copy", () => {
    expect(resolveRoundId("250,000 USD is held against Series B, pending acceptance.", rounds)).toBe("r1");
  });

  it("prefers the longest matching name", () => {
    expect(resolveRoundId("Your commitment to Series B Extension was accepted.", rounds)).toBe("r2");
  });

  it("is case-insensitive", () => {
    expect(resolveRoundId("interest in gigafactory grid storage", rounds)).toBe("r3");
  });

  it("returns null when nothing matches", () => {
    expect(resolveRoundId("Wire transfer cleared", rounds)).toBeNull();
  });

  it("ignores blank or too-short round names", () => {
    expect(resolveRoundId("a b", [{ id: "x", name: "  " }, { id: "y", name: "ab" }])).toBeNull();
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("returns the requested slice", () => {
    const res = paginate(items, 2, 10);
    expect(res.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(res).toMatchObject({ page: 2, pageSize: 10, total: 25, pageCount: 3 });
  });

  it("clamps out-of-range pages", () => {
    expect(paginate(items, 99, 10).page).toBe(3);
    expect(paginate(items, 0, 10).page).toBe(1);
    expect(paginate(items, -4, 10).page).toBe(1);
  });

  it("handles an empty feed", () => {
    const res = paginate([], 1, 10);
    expect(res.items).toEqual([]);
    expect(res.pageCount).toBe(1);
    expect(res.total).toBe(0);
  });

  it("guards against a zero page size", () => {
    expect(paginate(items, 1, 0).pageSize).toBe(1);
  });
});
