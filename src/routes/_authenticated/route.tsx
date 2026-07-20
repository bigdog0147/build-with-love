import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    // Block dashboard until email is verified
    const confirmed =
      Boolean(data.user.email_confirmed_at) ||
      Boolean((data.user as { confirmed_at?: string }).confirmed_at);
    if (!confirmed) {
      throw redirect({ to: "/auth", search: { verify: 1 } as never });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
