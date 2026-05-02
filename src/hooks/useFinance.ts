import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/db";

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
      return await api.getAccounts(tenant!.id) as DbAccount[];
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
        return await api.updateAccount(tenant.id, a.id, payload);
      }
      return await api.createAccount(tenant.id, payload);
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
      // Transactions endpoint not implemented yet, return empty array
      return [];
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
      // Transactions endpoint not implemented yet
      throw new Error('Transaction creation not implemented yet - needs transaction endpoint');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["party-balances"] });
    },
  });
};
