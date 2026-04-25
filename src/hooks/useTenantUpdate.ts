import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export const useUpdateTenant = () => {
  const { tenant, refresh } = useTenant();
  return useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      if (!tenant) throw new Error("No tenant");
      const { error } = await supabase.from("tenants").update(patch as any).eq("id", tenant.id);
      if (error) throw error;
      await refresh();
    },
  });
};
