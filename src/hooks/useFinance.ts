import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";

export type DbAccount = {
  id: string; tenant_id: string; name: string; type: string; balance: number;
  account_number: string | null; ifsc: string | null; is_active: boolean;
};

export const useAccounts = () => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["accounts", tenant?.id],
    enabled: !!tenant,
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").eq("tenant_id", tenant!.id).order("created_at");
      if (error) throw error;
      return (data ?? []) as DbAccount[];
    },
  });
};

export const useUpsertAccount = () => {
  const qc = useQueryClient();
  const { tenant } = useTenant();
  return useMutation({
    mutationFn: async (a: Partial<DbAccount> & { id?: string }) => {
      if (!tenant) throw new Error("No tenant");
      const payload = { ...a, tenant_id: tenant.id };
      if (a.id) {
        const { data, error } = await supabase.from("accounts").update(payload).eq("id", a.id).select().single();
        if (error) throw error; return data;
      }
      const { data, error } = await supabase.from("accounts").insert(payload as any).select().single();
      if (error) throw error; return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
};

export const useTransactions = (limit = 100) => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["transactions", tenant?.id, limit],
    enabled: !!tenant,
    queryFn: async () => {
      const { data, error } = await supabase.from("transactions").select("*, accounts(name, type)")
        .eq("tenant_id", tenant!.id).order("txn_date", { ascending: false }).order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useCreateTransaction = () => {
  const qc = useQueryClient();
  const { tenant } = useTenant();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (t: {
      type: "receipt" | "payment" | "expense" | "income";
      account_id: string | null; party_id?: string | null; party_name?: string;
      category?: string; amount: number; mode: string; notes?: string;
      reference?: string; txn_date?: string;
    }) => {
      if (!tenant || !user) throw new Error("Not ready");
      const { error } = await supabase.from("transactions").insert({
        tenant_id: tenant.id, created_by: user.id, ...t,
      });
      if (error) throw error;
      // Adjust account balance
      if (t.account_id) {
        const { data: a } = await supabase.from("accounts").select("balance").eq("id", t.account_id).maybeSingle();
        if (a) {
          const sign = (t.type === "receipt" || t.type === "income") ? 1 : -1;
          await supabase.from("accounts").update({ balance: Number(a.balance) + sign * t.amount }).eq("id", t.account_id);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["party-balances"] });
    },
  });
};
