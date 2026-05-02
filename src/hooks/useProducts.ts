import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/lib/queries-extended";

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
      return await getProducts(tenant!.id) as DbProduct[];
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
        return await updateProduct(p.id, payload);
      }
      return await createProduct(tenant.id, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  const { tenant } = useTenant();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!tenant) throw new Error("No tenant");
      await deleteProduct(id, tenant.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
};
