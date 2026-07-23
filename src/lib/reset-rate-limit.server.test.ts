import { describe, it, expect, beforeEach, vi } from "vitest";

// In-memory mock of the supabaseAdmin query builder — enough surface for the
// two shapes the limiter uses:
//   .from(t).select('id', { count: 'exact', head: true }).eq(...).eq(...).gte(...)
//   .from(t).insert(rows)
//   .from(t).delete().lt(...)

type Row = { key_type: "email_hash" | "ip"; key_value: string; attempted_at: string };

const store: { rows: Row[] } = { rows: [] };

function selectBuilder() {
  const filters: Array<(r: Row) => boolean> = [];
  const chain = {
    eq(col: keyof Row, val: string) {
      filters.push((r) => r[col] === val);
      return chain;
    },
    gte(col: keyof Row, val: string) {
      filters.push((r) => r[col] >= val);
      return chain;
    },
    then(resolve: (v: { count: number }) => void) {
      const count = store.rows.filter((r) => filters.every((f) => f(r))).length;
      resolve({ count });
    },
  };
  return chain;
}

function deleteBuilder() {
  const filters: Array<(r: Row) => boolean> = [];
  const chain = {
    lt(col: keyof Row, val: string) {
      filters.push((r) => r[col] < val);
      // execute
      store.rows = store.rows.filter((r) => !filters.every((f) => f(r)));
      return Promise.resolve({});
    },
  };
  return chain;
}

const supabaseAdmin = {
  from(_table: string) {
    return {
      select(_cols: string, _opts?: unknown) {
        return selectBuilder();
      },
      insert(rows: Array<Omit<Row, "attempted_at">> | Omit<Row, "attempted_at">) {
        const arr = Array.isArray(rows) ? rows : [rows];
        const now = new Date().toISOString();
        for (const r of arr) store.rows.push({ ...r, attempted_at: now });
        return Promise.resolve({});
      },
      delete() {
        return deleteBuilder();
      },
    };
  },
};

vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin }));

beforeEach(() => {
  store.rows = [];
});

describe("checkAndRecordResetAttempt", () => {
  it("allows attempts under the hourly limit", async () => {
    const { checkAndRecordResetAttempt, getLimits } = await import("./reset-rate-limit.server");
    const limits = getLimits();
    for (let i = 0; i < limits.emailPerHour; i++) {
      const r = await checkAndRecordResetAttempt({ emailHash: "h1", ip: null });
      expect(r.limited).toBe(false);
    }
  });

  it("limits once the per-email hourly threshold is crossed", async () => {
    const { checkAndRecordResetAttempt, getLimits } = await import("./reset-rate-limit.server");
    const limits = getLimits();
    for (let i = 0; i < limits.emailPerHour; i++) {
      await checkAndRecordResetAttempt({ emailHash: "h1", ip: null });
    }
    const r = await checkAndRecordResetAttempt({ emailHash: "h1", ip: null });
    expect(r.limited).toBe(true);
    expect(r.reason).toMatch(/email_hash/);
  });

  it("still records the attempt when limited (budget keeps decaying)", async () => {
    const { checkAndRecordResetAttempt, getLimits } = await import("./reset-rate-limit.server");
    const limits = getLimits();
    for (let i = 0; i < limits.emailPerHour + 3; i++) {
      await checkAndRecordResetAttempt({ emailHash: "h1", ip: null });
    }
    const forEmail = store.rows.filter((r) => r.key_type === "email_hash");
    expect(forEmail.length).toBe(limits.emailPerHour + 3);
  });

  it("isolates budgets across different email hashes", async () => {
    const { checkAndRecordResetAttempt, getLimits } = await import("./reset-rate-limit.server");
    const limits = getLimits();
    for (let i = 0; i < limits.emailPerHour; i++) {
      await checkAndRecordResetAttempt({ emailHash: "a", ip: null });
    }
    const r = await checkAndRecordResetAttempt({ emailHash: "b", ip: null });
    expect(r.limited).toBe(false);
  });

  it("limits on IP even when the email is fresh", async () => {
    const { checkAndRecordResetAttempt, getLimits } = await import("./reset-rate-limit.server");
    const limits = getLimits();
    for (let i = 0; i < limits.ipPerHour; i++) {
      await checkAndRecordResetAttempt({
        emailHash: `unique-${i}`,
        ip: "1.2.3.4",
      });
    }
    const r = await checkAndRecordResetAttempt({
      emailHash: "unique-new",
      ip: "1.2.3.4",
    });
    expect(r.limited).toBe(true);
    expect(r.reason).toMatch(/ip/);
  });

  it("does not throttle IP when it is null", async () => {
    const { checkAndRecordResetAttempt, getLimits } = await import("./reset-rate-limit.server");
    const limits = getLimits();
    for (let i = 0; i < limits.ipPerHour + 5; i++) {
      await checkAndRecordResetAttempt({
        emailHash: `unique-${i}`,
        ip: null,
      });
    }
    const ipRows = store.rows.filter((r) => r.key_type === "ip");
    expect(ipRows.length).toBe(0);
  });
});
