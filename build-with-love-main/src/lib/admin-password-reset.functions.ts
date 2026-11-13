import { createServerFn } from "@tanstack/react-start";

async function requestMeta() {
  const { getRequest } = await import("@tanstack/react-start/server");
  try {
    const request = getRequest();
    return {
      ip:
        request?.headers.get("cf-connecting-ip") ??
        request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        null,
      user_agent: request?.headers.get("user-agent") ?? null,
    };
  } catch {
    return { ip: null, user_agent: null };
  }
}

/**
 * Requests an administrator password reset. Intentionally unauthenticated and
 * always returns the same generic result (no account enumeration).
 */
export const startAdminPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; origin?: string }) => ({
    email: String(input.email ?? "").slice(0, 320),
    origin: input.origin ? String(input.origin).slice(0, 300) : undefined,
  }))
  .handler(async ({ data }) => {
    const { requestAdminPasswordReset } = await import("./admin-password-reset.server");
    return requestAdminPasswordReset(data.email, data.origin, await requestMeta());
  });

/** Validates the one-time link without consuming it; reveals only a masked email. */
export const inspectAdminResetLink = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({
    token: String(input.token ?? "").slice(0, 200),
  }))
  .handler(async ({ data }) => {
    const { inspectAdminResetToken } = await import("./admin-password-reset.server");
    return inspectAdminResetToken(data.token);
  });

/** Consumes the one-time token + emailed code and sets the new password. */
export const finishAdminPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; code: string; password: string }) => ({
    token: String(input.token ?? "").slice(0, 200),
    code: String(input.code ?? "").slice(0, 12),
    password: String(input.password ?? "").slice(0, 200),
  }))
  .handler(async ({ data }) => {
    const { completeAdminPasswordReset } = await import("./admin-password-reset.server");
    return completeAdminPasswordReset(data.token, data.code, data.password, await requestMeta());
  });
