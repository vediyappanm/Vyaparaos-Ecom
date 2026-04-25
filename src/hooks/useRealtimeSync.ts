import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

/**
 * Subscribes to postgres_changes for the active tenant and invalidates
 * relevant React Query caches so multiple devices stay in sync.
 */
export const useRealtimeSync = () => {
  const { tenant } = useTenant();
  const qc = useQueryClient();

  useEffect(() => {
    if (!tenant?.id) return;
    const filter = `tenant_id=eq.${tenant.id}`;

    const tableToKeys: Record<string, string[]> = {
      orders: ["orders", "dashboard"],
      order_items: ["orders", "dashboard"],
      products: ["products", "dashboard"],
      stock_movements: ["stock_movements", "dashboard"],
      transactions: ["transactions", "finance", "dashboard"],
      purchases: ["purchases"],
      parties: ["parties"],
      staff: ["staff"],
      accounts: ["finance"],
      tenants: ["tenant"],
    };

    const channel = supabase.channel(`tenant-${tenant.id}`);
    Object.keys(tableToKeys).forEach((table) => {
      channel.on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table, filter },
        () => tableToKeys[table].forEach((k) => qc.invalidateQueries({ queryKey: [k] })),
      );
    });
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tenant?.id, qc]);
};
