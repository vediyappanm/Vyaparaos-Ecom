import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";

export type PurchaseItemInput = {
  product_id: string | null;
  product_name: string;
  qty: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
};

export type CreatePurchaseInput = {
  vendor_id: string | null;
  vendor_name: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  status: "draft" | "received" | "partial" | "paid";
  notes?: string;
  items: PurchaseItemInput[];
};

export const usePurchases = () => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["purchases", tenant?.id],
    enabled: !!tenant,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases").select("*, purchase_items(*)").eq("tenant_id", tenant!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useCreatePurchase = () => {
  const qc = useQueryClient();
  const { tenant } = useTenant();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CreatePurchaseInput) => {
      if (!tenant || !user) throw new Error("Not ready");
      const { count } = await supabase.from("purchases").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.id);
      const purchase_number = `PUR-${String((count ?? 0) + 1).padStart(4, "0")}`;
      const { data: p, error } = await supabase.from("purchases").insert({
        tenant_id: tenant.id, purchase_number, vendor_id: input.vendor_id, vendor_name: input.vendor_name,
        subtotal: input.subtotal, tax_amount: input.tax_amount, total: input.total,
        paid_amount: input.paid_amount, status: input.status, notes: input.notes ?? null, created_by: user.id,
      }).select().single();
      if (error) throw error;
      const items = input.items.map(it => ({ ...it, purchase_id: p.id, tenant_id: tenant.id }));
      await supabase.from("purchase_items").insert(items);
      // Increment stock + create stock movements
      for (const it of input.items) {
        if (!it.product_id) continue;
        const { data: prod } = await supabase.from("products").select("stock_qty").eq("id", it.product_id).maybeSingle();
        if (prod) await supabase.from("products").update({ stock_qty: Number(prod.stock_qty) + it.qty }).eq("id", it.product_id);
        await supabase.from("stock_movements").insert({
          tenant_id: tenant.id, product_id: it.product_id, product_name: it.product_name,
          type: "purchase", qty: it.qty, reference: purchase_number, created_by: user.id,
        });
      }
      return p;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });
};
