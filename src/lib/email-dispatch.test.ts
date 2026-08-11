import { describe, expect, it, vi } from "vitest";
import { runDispatchJobs, type DispatchJob } from "./email-dispatch.server";

const job = (over: Partial<DispatchJob> = {}): DispatchJob => ({
  userId: "u1",
  category: "announcements",
  title: "t",
  detail: "d",
  template: "commitment-status",
  idempotencyKey: "k1",
  ...over,
});

describe("runDispatchJobs", () => {
  it("runs every job even when one throws", async () => {
    const dispatch = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValue({ inapp: true, email: true });
    const log = vi.fn();

    const out = await runDispatchJobs([job({ idempotencyKey: "a" }), job({ idempotencyKey: "b" })], dispatch, log);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(out[0]).toMatchObject({ ok: false, label: "a", error: "boom" });
    expect(out[1]).toMatchObject({ ok: true, label: "b" });
    expect(log).toHaveBeenCalled();
  });

  it("logs suppressed or opted-out recipients without failing the job", async () => {
    const dispatch = vi
      .fn()
      .mockResolvedValue({ inapp: true, email: false, emailSkippedReason: "recipient_suppressed" });
    const log = vi.fn();

    const out = await runDispatchJobs([job()], dispatch, log);

    expect(out[0]).toMatchObject({ ok: true });
    expect(log.mock.calls[0]?.[0]).toContain("recipient_suppressed");
  });

  it("passes the idempotency key through untouched so retries never duplicate", async () => {
    const dispatch = vi.fn().mockResolvedValue({ inapp: true, email: true });
    await runDispatchJobs([job({ idempotencyKey: "commitment-accepted-42" })], dispatch, vi.fn());
    expect(dispatch.mock.calls[0]?.[0].idempotencyKey).toBe("commitment-accepted-42");
  });

  it("is a no-op for an empty job list", async () => {
    const dispatch = vi.fn();
    expect(await runDispatchJobs([], dispatch, vi.fn())).toEqual([]);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("runDispatchJobs retries", () => {
  const opts = { baseDelayMs: 1, maxDelayMs: 2, sleep: async () => {} };

  it("retries a transient throw and succeeds", async () => {
    const dispatch = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValue({ inapp: true, email: true });
    const report = vi.fn();

    const out = await runDispatchJobs([job()], dispatch, vi.fn(), { ...opts, report });

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(out[0]).toMatchObject({ ok: true, attempts: 2 });
    expect(report).not.toHaveBeenCalled();
  });

  it("does not retry terminal failures and reports them", async () => {
    const dispatch = vi.fn().mockRejectedValue(
      Object.assign(new Error("not verified"), { code: "domain_not_verified", status: 403 }),
    );
    const report = vi.fn();

    const out = await runDispatchJobs([job()], dispatch, vi.fn(), { ...opts, report });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(out[0]).toMatchObject({ ok: false, retryable: false, attempts: 1 });
    expect(report).toHaveBeenCalledTimes(1);
  });

  it("gives up after the attempt budget and reports for manual resend", async () => {
    const dispatch = vi.fn().mockRejectedValue(new Error("boom"));
    const report = vi.fn();

    const out = await runDispatchJobs([job()], dispatch, vi.fn(), { ...opts, attempts: 3, report });

    expect(dispatch).toHaveBeenCalledTimes(3);
    expect(out[0]).toMatchObject({ ok: false, attempts: 3, retryable: true });
    expect(report.mock.calls[0]?.[0]).toMatchObject({ attempts: 3, error: "boom" });
  });

  it("retries a retryable email outcome reported by the dispatcher", async () => {
    const dispatch = vi
      .fn()
      .mockResolvedValueOnce({ inapp: true, email: false, emailRetryable: true, emailSkippedReason: "429" })
      .mockResolvedValue({ inapp: true, email: true });
    const report = vi.fn();

    const out = await runDispatchJobs([job()], dispatch, vi.fn(), { ...opts, report });

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(out[0]).toMatchObject({ ok: true, attempts: 2 });
    expect(report).not.toHaveBeenCalled();
  });

  it("never mutates the idempotency key across retries", async () => {
    const dispatch = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValue({ inapp: true, email: true });
    await runDispatchJobs([job({ idempotencyKey: "raise-advance-1" })], dispatch, vi.fn(), opts);
    expect(dispatch.mock.calls.map((c) => c[0].idempotencyKey)).toEqual([
      "raise-advance-1",
      "raise-advance-1",
    ]);
  });
});
