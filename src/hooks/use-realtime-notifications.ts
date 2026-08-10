import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TABLES = ["notifications", "transactions", "support_tickets"] as const;

/**
 * Keeps notification data (list + unread badge) fresh in real time.
 * Subscribes once per mounting component and invalidates the
 * ["notifications"] query family whenever a relevant row changes.
 */
export function useRealtimeNotifications(channelName: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    let channel = supabase.channel(channelName);
    for (const table of TABLES) {
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, invalidate);
    }
    channel.subscribe();

    const onVisible = () => {
      if (document.visibilityState === "visible") invalidate();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [channelName, queryClient]);
}
