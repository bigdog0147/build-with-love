/**
 * Client-safe investment maths. Every performance figure shown to an investor
 * comes from these helpers so the marketplace, portfolio, investor dashboard and
 * generated statements can never disagree with one another.
 */

export type HoldingLike = {
  id: string;
  product_id: string;
  invested: number | string;
  current_value: number | string;
  units: number | string;
  currency: string;
  status: string;
};

export type ProductLike = {
  id: string;
  name: string;
  sector: string;
  category: string;
  target_yield: number | string;
  currency: string;
  minimum: number | string;
  capacity?: number | string | null;
};

export type DistributionLike = { holding_id: string; amount: number | string; kind: string };

export const COUNTED_STATUSES = ["pending", "active"] as const;

const num = (value: number | string | null | undefined) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export type Position = {
  id: string;
  productId: string;
  status: string;
  currency: string;
  units: number;
  invested: number;
  currentValue: number;
  gain: number;
  gainPct: number;
  distributions: number;
  totalReturn: number;
  totalReturnPct: number;
};

/** Cost basis, unrealised gain and distribution-inclusive return for one holding. */
export function toPosition(holding: HoldingLike, distributions: DistributionLike[] = []): Position {
  const invested = num(holding.invested);
  const currentValue = num(holding.current_value);
  const paid = distributions
    .filter((d) => d.holding_id === holding.id)
    .reduce((sum, d) => sum + num(d.amount), 0);
  const gain = currentValue - invested;
  const totalReturn = gain + paid;
  return {
    id: holding.id,
    productId: holding.product_id,
    status: holding.status,
    currency: holding.currency,
    units: num(holding.units),
    invested,
    currentValue,
    gain,
    gainPct: invested > 0 ? (gain / invested) * 100 : 0,
    distributions: paid,
    totalReturn,
    totalReturnPct: invested > 0 ? (totalReturn / invested) * 100 : 0,
  };
}

export type PortfolioSummary = {
  positions: number;
  activePositions: number;
  invested: number;
  currentValue: number;
  gain: number;
  gainPct: number;
  distributions: number;
  totalReturn: number;
  totalReturnPct: number;
  weightedYield: number;
};

/** Aggregate summary across every counted position. */
export function summarisePortfolio(
  positions: Position[],
  products: ProductLike[] = [],
): PortfolioSummary {
  const counted = positions.filter((p) => (COUNTED_STATUSES as readonly string[]).includes(p.status));
  const invested = counted.reduce((s, p) => s + p.invested, 0);
  const currentValue = counted.reduce((s, p) => s + p.currentValue, 0);
  const distributions = counted.reduce((s, p) => s + p.distributions, 0);
  const gain = currentValue - invested;
  const totalReturn = gain + distributions;

  const yieldById = new Map(products.map((p) => [p.id, num(p.target_yield)]));
  const weighted = counted.reduce((s, p) => s + p.invested * (yieldById.get(p.productId) ?? 0), 0);

  return {
    positions: positions.length,
    activePositions: counted.filter((p) => p.status === "active").length,
    invested,
    currentValue,
    gain,
    gainPct: invested > 0 ? (gain / invested) * 100 : 0,
    distributions,
    totalReturn,
    totalReturnPct: invested > 0 ? (totalReturn / invested) * 100 : 0,
    weightedYield: invested > 0 ? weighted / invested : 0,
  };
}

/** Exposure share per grouping key, largest first. */
export function exposureBy(
  positions: Position[],
  products: ProductLike[],
  key: "sector" | "category" | "name",
): { label: string; value: number; percent: number }[] {
  const meta = new Map(products.map((p) => [p.id, p]));
  const totals = new Map<string, number>();
  for (const p of positions) {
    if (!(COUNTED_STATUSES as readonly string[]).includes(p.status)) continue;
    const label = meta.get(p.productId)?.[key] ?? "Unclassified";
    totals.set(label, (totals.get(label) ?? 0) + p.currentValue);
  }
  const total = [...totals.values()].reduce((s, v) => s + v, 0);
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value, percent: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

export const SUBSCRIPTION_MIN = 1;

/** Remaining capacity on a product, or null when the product is uncapped. */
export function remainingCapacity(
  product: ProductLike,
  subscribed: number,
): number | null {
  if (product.capacity == null) return null;
  return Math.max(0, num(product.capacity) - subscribed);
}

/**
 * Validates a subscription request against the product's minimum and remaining
 * capacity. Returns the accepted amount; throws with an investor-readable
 * message otherwise.
 */
export function validateSubscription(input: {
  amount: number;
  product: ProductLike;
  subscribed: number;
  status: string;
}): number {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter an amount greater than zero.");
  if (input.status !== "published") throw new Error("This opportunity is not open for subscription.");
  const minimum = num(input.product.minimum);
  if (amount < Math.max(minimum, SUBSCRIPTION_MIN))
    throw new Error(
      `The minimum subscription for ${input.product.name} is ${minimum.toLocaleString()} ${input.product.currency}.`,
    );
  const remaining = remainingCapacity(input.product, input.subscribed);
  if (remaining != null && amount > remaining)
    throw new Error(
      remaining <= 0
        ? "This opportunity is fully subscribed."
        : `Only ${remaining.toLocaleString()} ${input.product.currency} of capacity remains.`,
    );
  return Number(amount.toFixed(2));
}

/** Units issued for an invested amount at a given unit price (1.00 base). */
export function unitsFor(amount: number, unitPrice = 1): number {
  const price = unitPrice > 0 ? unitPrice : 1;
  return Number((amount / price).toFixed(6));
}

/** Progress of a raise round against its target, clamped to 100%. */
export function raiseProgress(committed: number, target: number): number {
  if (!(target > 0)) return 0;
  return Math.min(100, (committed / target) * 100);
}

export function validateCommitment(input: {
  amount: number;
  minimumTicket: number;
  status: string;
}): number {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter an amount greater than zero.");
  if (input.status !== "open") throw new Error("This round is not accepting commitments.");
  const min = num(input.minimumTicket);
  if (min > 0 && amount < min)
    throw new Error(`The minimum ticket for this round is ${min.toLocaleString()}.`);
  return Number(amount.toFixed(2));
}
