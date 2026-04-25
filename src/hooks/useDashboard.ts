import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export const useDashboard = () => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["dashboard", tenant?.id],
    enabled: !!tenant,
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();
      const start14 = new Date(); start14.setDate(start14.getDate() - 13); start14.setHours(0, 0, 0, 0);

      const [{ data: orders }, { data: items }, { data: products }] = await Promise.all([
        supabase.from("orders").select("id, order_number, party_name, party_phone, total, tax_amount, balance_due, payment_mode, payment_status, status, channel, created_at")
          .eq("tenant_id", tenant!.id).gte("created_at", start14.toISOString()).order("created_at", { ascending: false }),
        supabase.from("order_items").select("product_id, product_name, qty, total, created_at")
          .eq("tenant_id", tenant!.id).gte("created_at", start14.toISOString()),
        supabase.from("products").select("id, name, sku, image_url, stock_qty, low_stock_alert, unit").eq("tenant_id", tenant!.id),
      ]);

      const todayOrders = (orders ?? []).filter(o => new Date(o.created_at) >= today);
      const todaySales = todayOrders.reduce((s, o) => s + Number(o.total), 0);
      const pendingDues = (orders ?? []).filter(o => o.payment_status !== "paid").reduce((s, o) => s + Number(o.balance_due), 0);
      const lowStock = (products ?? []).filter(p => Number(p.stock_qty) <= Number(p.low_stock_alert));

      // 14-day trend
      const trend: Record<string, { sales: number; orders: number }> = {};
      for (let i = 0; i < 14; i++) {
        const d = new Date(); d.setDate(d.getDate() - (13 - i)); d.setHours(0, 0, 0, 0);
        const k = d.toISOString().slice(0, 10);
        trend[k] = { sales: 0, orders: 0 };
      }
      for (const o of orders ?? []) {
        const k = new Date(o.created_at).toISOString().slice(0, 10);
        if (trend[k]) { trend[k].sales += Number(o.total); trend[k].orders += 1; }
      }
      const salesTrend = Object.entries(trend).map(([d, v]) => ({
        date: new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        sales: v.sales, orders: v.orders,
      }));

      // Top products by qty
      const productAgg: Record<string, { name: string; sold: number }> = {};
      for (const it of items ?? []) {
        const k = it.product_name;
        productAgg[k] = productAgg[k] ?? { name: k, sold: 0 };
        productAgg[k].sold += Number(it.qty);
      }
      const topProducts = Object.values(productAgg).sort((a, b) => b.sold - a.sold).slice(0, 5);

      return {
        kpis: {
          todaySales, todayOrders: todayOrders.length, pendingDues,
          lowStockCount: lowStock.length, totalOrders: (orders ?? []).length,
        },
        salesTrend, topProducts, lowStock, recentOrders: (orders ?? []).slice(0, 6),
      };
    },
  });
};
