import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";

export const useStockMovements = (limit = 50) => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["stock-movements", tenant?.id, limit],
    enabled: !!tenant,
    queryFn: async () => {
      const { data, error } = await supabase.from("stock_movements").select("*")
        .eq("tenant_id", tenant!.id).order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useCreateStockAdjustment = () => {
  const qc = useQueryClient();
  const { tenant } = useTenant();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      product_id: string; product_name: string; qty: number;
      type: "adjustment" | "damage" | "return"; notes?: string;
    }) => {
      if (!tenant || !user) throw new Error("Not ready");
      const { data: prod } = await supabase.from("products").select("stock_qty").eq("id", input.product_id).maybeSingle();
      if (prod) {
        await supabase.from("products").update({ stock_qty: Math.max(0, Number(prod.stock_qty) + input.qty) }).eq("id", input.product_id);
      }
      const { error } = await supabase.from("stock_movements").insert({
        tenant_id: tenant.id, product_id: input.product_id, product_name: input.product_name,
        type: input.type, qty: input.qty, notes: input.notes ?? null, reference: `ADJ-${Date.now()}`,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });
};
