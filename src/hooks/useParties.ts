import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

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
      const { data, error } = await supabase.from("parties").select("*").eq("tenant_id", tenant!.id).order("name");
      if (error) throw error;
      return (data ?? []) as DbParty[];
    },
  });
};

export const usePartyBalances = () => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["party-balances", tenant?.id],
    enabled: !!tenant,
    queryFn: async () => {
      const [{ data: parties }, { data: orders }, { data: purchases }, { data: txns }] = await Promise.all([
        supabase.from("parties").select("*").eq("tenant_id", tenant!.id),
        supabase.from("orders").select("party_id, party_name, total, paid_amount").eq("tenant_id", tenant!.id),
        supabase.from("purchases").select("vendor_id, vendor_name, total, paid_amount").eq("tenant_id", tenant!.id),
        supabase.from("transactions").select("party_id, party_name, type, amount").eq("tenant_id", tenant!.id),
      ]);
      const map = new Map<string, number>();
      // Receivables: order total - paid
      for (const o of orders ?? []) {
        if (!o.party_id) continue;
        map.set(o.party_id, (map.get(o.party_id) ?? 0) + Number(o.total) - Number(o.paid_amount));
      }
      // Payables: purchase total - paid (negative)
      for (const p of purchases ?? []) {
        if (!p.vendor_id) continue;
        map.set(p.vendor_id, (map.get(p.vendor_id) ?? 0) - (Number(p.total) - Number(p.paid_amount)));
      }
      // Direct receipts/payments adjust
      for (const t of txns ?? []) {
        if (!t.party_id) continue;
        const sign = t.type === "receipt" ? -1 : t.type === "payment" ? 1 : 0;
        map.set(t.party_id, (map.get(t.party_id) ?? 0) + sign * Number(t.amount));
      }
      return (parties ?? []).map((p: any) => ({ ...p, balance: Number(p.opening_balance ?? 0) + (map.get(p.id) ?? 0) }));
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
        const { data, error } = await supabase.from("parties").update(payload).eq("id", p.id).select().single();
        if (error) throw error; return data;
      }
      const { data, error } = await supabase.from("parties").insert(payload as any).select().single();
      if (error) throw error; return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["parties"] }); qc.invalidateQueries({ queryKey: ["party-balances"] }); },
  });
};

export const useDeleteParty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("parties").delete().eq("id", id);
      if (error) throw error;
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
      const [{ data: orders }, { data: purchases }, { data: txns }] = await Promise.all([
        supabase.from("orders").select("order_number, total, created_at").eq("tenant_id", tenant!.id).eq("party_id", partyId!),
        supabase.from("purchases").select("purchase_number, total, created_at").eq("tenant_id", tenant!.id).eq("vendor_id", partyId!),
        supabase.from("transactions").select("type, amount, txn_date, mode, notes").eq("tenant_id", tenant!.id).eq("party_id", partyId!),
      ]);
      type Row = { date: string; particulars: string; debit: number; credit: number };
      const rows: Row[] = [];
      for (const o of orders ?? []) rows.push({ date: o.created_at, particulars: `Sale ${o.order_number}`, debit: Number(o.total), credit: 0 });
      for (const p of purchases ?? []) rows.push({ date: p.created_at, particulars: `Purchase ${p.purchase_number}`, debit: 0, credit: Number(p.total) });
      for (const t of txns ?? []) rows.push({
        date: t.txn_date, particulars: `${t.type === "receipt" ? "Receipt" : "Payment"} — ${t.mode ?? ""} ${t.notes ?? ""}`,
        debit: t.type === "payment" ? Number(t.amount) : 0,
        credit: t.type === "receipt" ? Number(t.amount) : 0,
      });
      rows.sort((a, b) => a.date.localeCompare(b.date));
      let bal = 0;
      return rows.map(r => { bal += r.debit - r.credit; return { ...r, balance: bal }; });
    },
  });
};
