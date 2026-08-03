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
