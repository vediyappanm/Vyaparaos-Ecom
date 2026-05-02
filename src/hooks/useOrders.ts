import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { getOrders, createOrder, getOrderItems, createOrderItem } from "@/lib/queries-extended";
import { db } from "@/lib/db";

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
      const orders = await getOrders(tenant!.id, limit);
      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        orders.map(async (order: any) => ({
          ...order,
          order_items: await getOrderItems(order.id, tenant.id)
        }))
      );
      return ordersWithItems;
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

      // Sequential order number per tenant - simplified for now
      const order_number = `INV-${Date.now()}`;

      const order = await createOrder(tenant.id, {
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
        notes: input.notes,
        items: input.items,
        created_by: user.id,
      });

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
