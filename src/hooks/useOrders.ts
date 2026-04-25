import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";

export type OrderItemInput = {
  product_id: string | null;
  product_name: string;
  hsn_code: string | null;
  qty: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
};

export type CreateOrderInput = {
  party_name: string | null;
  party_phone: string | null;
  channel: string;
  payment_mode: string;
  payment_status: "unpaid" | "partial" | "paid";
  subtotal: number;
  discount: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  balance_due: number;
  notes?: string;
  items: OrderItemInput[];
};

export const useOrders = (limit = 100) => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["orders", tenant?.id, limit],
    enabled: !!tenant,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("tenant_id", tenant!.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useCreateOrder = () => {
  const qc = useQueryClient();
  const { tenant } = useTenant();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      if (!tenant || !user) throw new Error("Not ready");

      // Sequential order number per tenant
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);
      const nextNo = (count ?? 0) + 1;
      const order_number = `INV-${String(nextNo).padStart(5, "0")}`;

      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          tenant_id: tenant.id,
          order_number,
          party_name: input.party_name,
          party_phone: input.party_phone,
          channel: input.channel,
          payment_mode: input.payment_mode,
          payment_status: input.payment_status,
          subtotal: input.subtotal,
          discount: input.discount,
          tax_amount: input.tax_amount,
          total: input.total,
          paid_amount: input.paid_amount,
          balance_due: input.balance_due,
          notes: input.notes ?? null,
          status: "confirmed",
          created_by: user.id,
        })
        .select()
        .single();
      if (oErr) throw oErr;

      const items = input.items.map((it) => ({ ...it, order_id: order.id, tenant_id: tenant.id }));
      const { error: iErr } = await supabase.from("order_items").insert(items);
      if (iErr) throw iErr;

      // Decrement stock + log stock movements
      for (const it of input.items) {
        if (!it.product_id) continue;
        const { data: p } = await supabase.from("products").select("stock_qty").eq("id", it.product_id).maybeSingle();
        if (p) {
          await supabase.from("products").update({ stock_qty: Math.max(0, Number(p.stock_qty) - it.qty) }).eq("id", it.product_id);
        }
        await supabase.from("stock_movements").insert({
          tenant_id: tenant.id, product_id: it.product_id, product_name: it.product_name,
          type: "sale", qty: -it.qty, reference: order_number, created_by: user.id,
        });
      }

      // Record receipt transaction if paid
      if (input.paid_amount > 0) {
        const { data: acc } = await supabase.from("accounts").select("id, balance, type")
          .eq("tenant_id", tenant.id).eq("is_active", true).order("created_at").limit(10);
        const modeMap: Record<string, string> = { Cash: "cash", UPI: "upi", Card: "bank", Credit: "bank" };
        const wantType = modeMap[input.payment_mode] ?? "cash";
        const account = (acc ?? []).find((a: any) => a.type === wantType) ?? acc?.[0];
        if (account) {
          await supabase.from("transactions").insert({
            tenant_id: tenant.id, account_id: account.id, type: "receipt",
            party_name: input.party_name, amount: input.paid_amount, mode: input.payment_mode,
            notes: `Order ${order_number}`, reference: order_number, created_by: user.id,
          });
          await supabase.from("accounts").update({ balance: Number(account.balance) + input.paid_amount }).eq("id", account.id);
        }
      }

      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};
