import { createFileRoute, redirect } from "@tanstack/react-router";

/** Canonical admin landing path; the console lives at /admin. */
export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/admin", replace: true });
  },
});
