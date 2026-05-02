import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { getStaff, createStaff } from "@/lib/queries-extended";
import { db } from "@/lib/db";

export type DbStaff = {
  id: string; tenant_id: string; name: string; phone: string | null;
  role: string; salary: number; join_date: string | null; status: string; notes: string | null;
};

export const useStaff = () => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["staff", tenant?.id],
    enabled: !!tenant,
    queryFn: async () => {
      // getStaff throws error because endpoint doesn't exist yet
      // Return empty array for now
      return [] as DbStaff[];
    },
  });
};

export const useUpsertStaff = () => {
  const qc = useQueryClient();
  const { tenant } = useTenant();
  return useMutation({
    mutationFn: async (s: Partial<DbStaff> & { id?: string }) => {
      if (!tenant) throw new Error("No tenant");
      const payload = { ...s, tenant_id: tenant.id };
      if (s.id) {
        // This would need a new endpoint
        throw new Error('updateStaff not implemented yet - needs staff endpoint');
      }
      return await createStaff(tenant.id, payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
};

export const useDeleteStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // This would need a new endpoint
      throw new Error('deleteStaff not implemented yet - needs staff endpoint');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
};
