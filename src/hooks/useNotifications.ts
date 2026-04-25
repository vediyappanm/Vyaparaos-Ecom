import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export type Notification = {
  id: string; tenant_id: string; type: string;
  title: string; body: string | null; link: string | null;
  is_read: boolean; created_at: string;
};

export const useNotifications = () => {
  const { tenant } = useTenant();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["notifications", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data, error } = await supabase.from("notifications")
        .select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    enabled: !!tenant,
  });

  // Realtime toast for new notifications
  useEffect(() => {
    if (!tenant?.id) return;
    const ch = supabase.channel(`notif-${tenant.id}`)
      .on("postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "notifications", filter: `tenant_id=eq.${tenant.id}` },
        (payload: any) => {
          toast(payload.new.title, { description: payload.new.body ?? undefined });
          qc.invalidateQueries({ queryKey: ["notifications", tenant.id] });
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tenant?.id, qc]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", tenant?.id] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!tenant) return;
      const { error } = await supabase.from("notifications").update({ is_read: true })
        .eq("tenant_id", tenant.id).eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", tenant?.id] }),
  });

  const items = list.data ?? [];
  const unreadCount = items.filter((n) => !n.is_read).length;

  return { items, unreadCount, isLoading: list.isLoading, markRead, markAllRead };
};
