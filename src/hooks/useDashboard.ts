import { useQuery } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { api } from "@/lib/db";

export const useDashboard = () => {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ["dashboard", tenant?.id],
    enabled: !!tenant,
    queryFn: async () => {
      const [orders, products] = await Promise.all([
        api.getOrders(tenant!.id),
        api.getProducts(tenant!.id),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayOrders = orders.filter((order: any) => new Date(order.created_at) >= today);
      const ydayOrders = orders.filter((order: any) => {
        const date = new Date(order.created_at);
        return date >= yesterday && date < today;
      });

      const todaySales = todayOrders.reduce((sum: number, order: any) => sum + Number(order.total), 0);
      const ydaySales = ydayOrders.reduce((sum: number, order: any) => sum + Number(order.total), 0);
      const salesDelta = ydaySales > 0 ? ((todaySales - ydaySales) / ydaySales) * 100 : (todaySales > 0 ? 100 : 0);
      const pendingDues = orders
        .filter((order: any) => order.payment_status !== "paid")
        .reduce((sum: number, order: any) => sum + Number(order.balance_due), 0);
      const lowStock = products.filter((product: any) => Number(product.stock_qty) <= Number(product.low_stock_alert));
      const inventoryValue = products.reduce((sum: number, product: any) => sum + Number(product.cost_price) * Number(product.stock_qty), 0);

      const salesTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayOrders = orders.filter((order: any) => new Date(order.created_at).toDateString() === date.toDateString());
        const daySales = dayOrders.reduce((sum: number, order: any) => sum + Number(order.total), 0);
        salesTrend.push({
          date: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          sales: daySales,
          orders: dayOrders.length,
        });
      }

      const recentOrders = orders.slice(0, 6);
      const recentOrderItems = await Promise.all(
        recentOrders.map((order: any) => api.getOrderItems(tenant!.id, order.id).catch(() => []))
      );
      const productAgg: Record<string, { name: string; sold: number; revenue: number }> = {};
      recentOrderItems.flat().forEach((item: any) => {
        const key = item.product_name || "Unknown product";
        productAgg[key] = productAgg[key] ?? { name: key, sold: 0, revenue: 0 };
        productAgg[key].sold += Number(item.qty || 0);
        productAgg[key].revenue += Number(item.total || 0);
      });
      const topProducts = Object.values(productAgg).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      const activity = orders.slice(0, 8).map((order: any) => ({
        kind: "order" as const,
        id: order.id,
        ts: order.created_at,
        title: `${order.order_number} - ${order.party_name ?? "Walk-in"}`,
        amount: Number(order.total),
        positive: true,
        status: order.status,
      }));

      return {
        kpis: {
          todaySales,
          todayOrders: todayOrders.length,
          ydaySales,
          salesDelta,
          pendingDues,
          lowStockCount: lowStock.length,
          totalOrders: orders.length,
          inventoryValue,
        },
        salesTrend,
        topProducts,
        lowStock,
        recentOrders,
        activity,
      };
    },
  });
};
