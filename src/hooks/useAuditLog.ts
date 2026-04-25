import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";

export type AuditEntry = {
  id: string; tenant_id: string; user_id: string | null; user_name: string | null;
  action: string; entity: string; entity_id: string | null; summary: string | null;
  metadata: any; created_at: string;
};

export const useAuditLog = () => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["audit_log", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data, error } = await supabase.from("audit_log")
        .select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as AuditEntry[];
    },
    enabled: !!tenant,
  });
};

export const useAuditLogger = () => {
  const { tenant } = useTenant();
  const { user } = useAuth();
  return async (action: string, entity: string, summary: string, entity_id?: string, metadata?: any) => {
    if (!tenant || !user) return;
    await supabase.from("audit_log").insert({
      tenant_id: tenant.id, user_id: user.id, user_name: user.email ?? null,
      action, entity, entity_id: entity_id ?? null, summary, metadata: metadata ?? {},
    });
  };
};
