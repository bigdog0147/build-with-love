import { describe, expect, it } from "vitest";
import { BLOCK_AT, REVIEW_AT, bandForScore } from "./risk-engine.server";

describe("bandForScore", () => {
  it("allows clean requests", () => {
    expect(bandForScore(0)).toBe("allow");
    expect(bandForScore(REVIEW_AT - 1)).toBe("allow");
  });

  it("flags mid-range scores for review", () => {
    expect(bandForScore(REVIEW_AT)).toBe("review");
    expect(bandForScore(BLOCK_AT - 1)).toBe("review");
  });

  it("blocks at and above the block threshold", () => {
    expect(bandForScore(BLOCK_AT)).toBe("block");
    expect(bandForScore(100)).toBe("block");
  });

  it("keeps thresholds ordered", () => {
    expect(REVIEW_AT).toBeLessThan(BLOCK_AT);
  });
});
