import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/contexts/TenantContext";
import { getParties, createParty } from "@/lib/queries-extended";
import { api } from "@/lib/db";

export type DbParty = {
  id: string; tenant_id: string; type: "customer" | "vendor";
  name: string; phone: string | null; email: string | null; gstin: string | null;
  address: string | null; city: string | null; state: string | null; pincode: string | null;
  opening_balance: number; notes: string | null;
};

export const useParties = () => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["parties", tenant?.id],
    enabled: !!tenant,
    queryFn: async () => {
      return await getParties(tenant!.id) as DbParty[];
    },
  });
};

export const usePartyBalances = () => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["party-balances", tenant?.id],
    enabled: !!tenant,
    queryFn: async () => {
      // Simplified balance calculation - just return parties with opening balance
      // Full implementation would need transaction endpoints
      const parties = await getParties(tenant!.id);
      return parties.map((p: any) => ({ ...p, balance: Number(p.opening_balance ?? 0) }));
    },
  });
};

export const useUpsertParty = () => {
  const qc = useQueryClient();
  const { tenant } = useTenant();
  return useMutation({
    mutationFn: async (p: Partial<DbParty> & { id?: string }) => {
      if (!tenant) throw new Error("No tenant");
      const payload = { ...p, tenant_id: tenant.id };
      if (p.id) {
        return await api.updateParty(tenant.id, p.id, payload);
      }
      return await createParty(tenant.id, payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parties"] }); qc.invalidateQueries({ queryKey: ["party-balances"] }); },
  });
};

export const useDeleteParty = () => {
  const qc = useQueryClient();
  const { tenant } = useTenant();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!tenant) throw new Error("No tenant");
      await api.deleteParty(tenant.id, id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parties"] }); qc.invalidateQueries({ queryKey: ["party-balances"] }); },
  });
};

export const usePartyLedger = (partyId: string | null) => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["party-ledger", tenant?.id, partyId],
    enabled: !!tenant && !!partyId,
    queryFn: async () => {
      // Simplified ledger - would need transaction and purchase endpoints
      return [];
    },
  });
};
