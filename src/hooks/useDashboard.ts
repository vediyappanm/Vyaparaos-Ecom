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
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const start14 = new Date(); start14.setDate(start14.getDate() - 13); start14.setHours(0, 0, 0, 0);
      const start30 = new Date(); start30.setDate(start30.getDate() - 29); start30.setHours(0, 0, 0, 0);

      const [{ data: orders }, { data: items }, { data: products }, { data: txns }] = await Promise.all([
        supabase.from("orders").select("id, order_number, party_name, party_phone, total, tax_amount, balance_due, payment_mode, payment_status, status, channel, created_at")
          .eq("tenant_id", tenant!.id).gte("created_at", start30.toISOString()).order("created_at", { ascending: false }),
        supabase.from("order_items").select("product_id, product_name, qty, total, created_at")
          .eq("tenant_id", tenant!.id).gte("created_at", start14.toISOString()),
        supabase.from("products").select("id, name, sku, image_url, stock_qty, low_stock_alert, unit, price, cost_price").eq("tenant_id", tenant!.id),
        supabase.from("transactions").select("id, type, amount, category, party_name, txn_date, created_at")
          .eq("tenant_id", tenant!.id).gte("created_at", start30.toISOString()).order("created_at", { ascending: false }).limit(50),
      ]);

      const ordersAll = orders ?? [];
      const todayOrders = ordersAll.filter(o => new Date(o.created_at) >= today);
      const ydayOrders = ordersAll.filter(o => { const d = new Date(o.created_at); return d >= yesterday && d < today; });
      const todaySales = todayOrders.reduce((s, o) => s + Number(o.total), 0);
      const ydaySales = ydayOrders.reduce((s, o) => s + Number(o.total), 0);
      const salesDelta = ydaySales > 0 ? ((todaySales - ydaySales) / ydaySales) * 100 : (todaySales > 0 ? 100 : 0);

      const pendingDues = ordersAll.filter(o => o.payment_status !== "paid").reduce((s, o) => s + Number(o.balance_due), 0);
      const lowStock = (products ?? []).filter(p => Number(p.stock_qty) <= Number(p.low_stock_alert));
      const inventoryValue = (products ?? []).reduce((s, p) => s + Number(p.cost_price) * Number(p.stock_qty), 0);

      // 14-day trend
      const trend: Record<string, { sales: number; orders: number }> = {};
      for (let i = 0; i < 14; i++) {
        const d = new Date(); d.setDate(d.getDate() - (13 - i)); d.setHours(0, 0, 0, 0);
        trend[d.toISOString().slice(0, 10)] = { sales: 0, orders: 0 };
      }
      for (const o of ordersAll) {
        const k = new Date(o.created_at).toISOString().slice(0, 10);
        if (trend[k]) { trend[k].sales += Number(o.total); trend[k].orders += 1; }
      }
      const salesTrend = Object.entries(trend).map(([d, v]) => ({
        date: new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        sales: v.sales, orders: v.orders,
      }));

      // Top products
      const productAgg: Record<string, { name: string; sold: number; revenue: number }> = {};
      for (const it of items ?? []) {
        const k = it.product_name;
        productAgg[k] = productAgg[k] ?? { name: k, sold: 0, revenue: 0 };
        productAgg[k].sold += Number(it.qty);
        productAgg[k].revenue += Number(it.total);
      }
      const topProducts = Object.values(productAgg).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      // Activity feed: orders + transactions, sorted desc, last 8
      const activity = [
        ...ordersAll.slice(0, 10).map(o => ({
          kind: "order" as const, id: o.id, ts: o.created_at,
          title: `${o.order_number} · ${o.party_name ?? "Walk-in"}`,
          amount: Number(o.total), positive: true, status: o.status,
        })),
        ...(txns ?? []).slice(0, 10).map(t => ({
          kind: "txn" as const, id: t.id, ts: t.created_at,
          title: `${t.type === "in" ? "Received" : "Paid"} · ${t.category ?? t.party_name ?? "—"}`,
          amount: Number(t.amount), positive: t.type === "in", status: t.type,
        })),
      ].sort((a, b) => +new Date(b.ts) - +new Date(a.ts)).slice(0, 8);

      return {
        kpis: {
          todaySales, todayOrders: todayOrders.length, ydaySales, salesDelta,
          pendingDues, lowStockCount: lowStock.length,
          totalOrders: ordersAll.length, inventoryValue,
        },
        salesTrend, topProducts, lowStock, recentOrders: ordersAll.slice(0, 6), activity,
      };
    },
  });
};
