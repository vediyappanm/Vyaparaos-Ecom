import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export type DbProduct = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  category: string | null;
  sku: string | null;
  barcode: string | null;
  hsn_code: string | null;
  unit: string;
  price: number;
  mrp: number;
  cost_price: number;
  tax_rate: number;
  stock_qty: number;
  low_stock_alert: number;
  image_url: string | null;
  is_active: boolean;
};

export const useProducts = () => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["products", tenant?.id],
    enabled: !!tenant,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("tenant_id", tenant!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbProduct[];
    },
  });
};

export const useUpsertProduct = () => {
  const qc = useQueryClient();
  const { tenant } = useTenant();
  return useMutation({
    mutationFn: async (p: Partial<DbProduct> & { id?: string }) => {
      if (!tenant) throw new Error("No tenant");
      const payload = { ...p, tenant_id: tenant.id };
      if (p.id) {
        const { data, error } = await supabase.from("products").update(payload).eq("id", p.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("products").insert(payload as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
};
