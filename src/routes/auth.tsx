import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy shared sign-in path — now split into isolated portals. */
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/login", replace: true });
  },
});
