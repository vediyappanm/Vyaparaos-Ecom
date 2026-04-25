import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

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
      const { data, error } = await supabase.from("staff").select("*").eq("tenant_id", tenant!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbStaff[];
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
        const { data, error } = await supabase.from("staff").update(payload).eq("id", s.id).select().single();
        if (error) throw error; return data;
      }
      const { data, error } = await supabase.from("staff").insert(payload as any).select().single();
      if (error) throw error; return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
};

export const useDeleteStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });
};
