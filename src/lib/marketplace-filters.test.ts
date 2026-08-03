import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  checkSizeBounds,
  deriveStage,
  facetCounts,
  facetValues,
  filledPercent,
  filterProducts,
  sortProducts,
  STAGES,
  withCount,

  type ShelfProduct,
} from "./marketplace-filters";

const make = (over: Partial<ShelfProduct> & { id: string }): ShelfProduct => ({
  slug: over.id,
  name: `Project ${over.id}`,
  category: "Infrastructure",
  sector: "Energy",
  summary: "Grid-scale storage",
  currency: "USD",
  minimum: 50000,
  target_yield: 9,
  term_months: 36,
  capacity: 1000000,
  ...over,
});

const products = [
  make({ id: "a", name: "Cell Line Alpha", category: "Manufacturing", sector: "Battery", minimum: 25000, target_yield: 11, term_months: 60, capacity: 1000000 }),
  make({ id: "b", name: "Robotics Cell Beta", category: "Automation", sector: "Robotics", minimum: 100000, target_yield: 8, term_months: 24, capacity: 1000000 }),
  make({ id: "c", name: "Grid Storage Gamma", category: "Infrastructure", sector: "Energy", minimum: 500000, target_yield: 7, term_months: 120, capacity: null }),
];

const subscribed = { a: 100000, b: 800000, c: 0 };

describe("filledPercent / deriveStage", () => {
  it("is null for uncapped projects and treats them as open", () => {
    expect(filledPercent(products[2]!, 999999)).toBeNull();
    expect(deriveStage(products[2]!, 999999)).toBe("open");
  });
  it("bands by subscribed capacity", () => {
    expect(deriveStage(products[0]!, 100000)).toBe("open");
    expect(deriveStage(products[0]!, 400000)).toBe("filling");
    expect(deriveStage(products[0]!, 800000)).toBe("closing");
    expect(deriveStage(products[0]!, 1000000)).toBe("full");
    expect(deriveStage(products[0]!, 1200000)).toBe("full");
  });
  it("clamps to 100%", () => {
    expect(filledPercent(products[0]!, 5000000)).toBe(100);
  });
});

describe("facets", () => {
  it("lists sorted unique categories and sectors", () => {
    expect(facetValues(products, "category")).toEqual(["Automation", "Infrastructure", "Manufacturing"]);
    expect(facetValues(products, "sector")).toEqual(["Battery", "Energy", "Robotics"]);
  });
  it("derives check-size bounds", () => {
    expect(checkSizeBounds(products)).toEqual({ min: 25000, max: 500000 });
    expect(checkSizeBounds([])).toEqual({ min: 0, max: 0 });
  });
});

describe("filterProducts", () => {
  it("returns everything by default", () => {
    expect(filterProducts(products, subscribed, {})).toHaveLength(3);
  });
  it("matches every search term across name, sector and summary", () => {
    expect(filterProducts(products, subscribed, { q: "robotics cell" }).map((p) => p.id)).toEqual(["b"]);
    expect(filterProducts(products, subscribed, { q: "storage gamma" }).map((p) => p.id)).toEqual(["c"]);
    expect(filterProducts(products, subscribed, { q: "storage" })).toHaveLength(3);

    expect(filterProducts(products, subscribed, { q: "nothing here" })).toEqual([]);
  });
  it("filters by category and sector", () => {
    expect(filterProducts(products, subscribed, { category: "Automation" }).map((p) => p.id)).toEqual(["b"]);
    expect(filterProducts(products, subscribed, { sector: "Battery" }).map((p) => p.id)).toEqual(["a"]);
  });
  it("filters by funding stage", () => {
    expect(filterProducts(products, subscribed, { stage: "closing" }).map((p) => p.id)).toEqual(["b"]);
    expect(filterProducts(products, subscribed, { stage: "open" }).map((p) => p.id)).toEqual(["a", "c"]);
  });
  it("filters by maximum check size and ignores zero", () => {
    expect(filterProducts(products, subscribed, { maxMinimum: 100000 }).map((p) => p.id)).toEqual(["a", "b"]);
    expect(filterProducts(products, subscribed, { maxMinimum: 0 })).toHaveLength(3);
  });
  it("combines filters", () => {
    expect(
      filterProducts(products, subscribed, { q: "cell", maxMinimum: 50000, stage: "open" }).map((p) => p.id),
    ).toEqual(["a"]);
  });
});

describe("sortProducts", () => {
  it("keeps curated order for recommended", () => {
    expect(sortProducts(products, "recommended").map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
  it("sorts by yield, minimum, term and name", () => {
    expect(sortProducts(products, "yield").map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(sortProducts(products, "minimum").map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(sortProducts(products, "term").map((p) => p.id)).toEqual(["b", "a", "c"]);
    expect(sortProducts(products, "name").map((p) => p.id)).toEqual(["a", "c", "b"]);
  });
  it("does not mutate the input", () => {
    const input = [...products];
    sortProducts(input, "name");
    expect(input.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
});

describe("activeFilterCount", () => {
  it("counts only non-default filters", () => {
    expect(activeFilterCount({})).toBe(0);
    expect(activeFilterCount({ sort: "yield" })).toBe(0);
    expect(activeFilterCount({ q: "  " })).toBe(0);
    expect(activeFilterCount({ q: "cell", stage: "full", maxMinimum: 1000 })).toBe(3);
  });
});

describe("facetCounts", () => {
  it("totals every option and includes an all bucket", () => {
    const counts = facetCounts(products, subscribed, {}, "category");
    expect(counts.all).toBe(products.length);
    const sum = Object.entries(counts)
      .filter(([k]) => k !== "all")
      .reduce((acc, [, v]) => acc + v, 0);
    expect(sum).toBe(products.length);
  });

  it("ignores the facet's own selection but honours other filters", () => {
    const all = facetCounts(products, subscribed, { category: "nope" }, "category");
    expect(all.all).toBe(products.length);

    const narrowed = facetCounts(products, subscribed, { q: "cell" }, "category");
    expect(narrowed.all).toBe(filterProducts(products, subscribed, { q: "cell" }).length);
  });

  it("always lists every funding stage, including zero matches", () => {
    const counts = facetCounts(products, subscribed, {}, "stage");
    for (const s of STAGES) expect(typeof counts[s.key]).toBe("number");
  });
});

describe("withCount", () => {
  it("renders the count and defaults to zero", () => {
    expect(withCount("Robotics", 3)).toBe("Robotics (3)");
    expect(withCount("Robotics", undefined)).toBe("Robotics (0)");
  });
});
