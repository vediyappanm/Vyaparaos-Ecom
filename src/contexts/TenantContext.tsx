import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  gstin: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  logo_url: string | null;
  currency: string;
  settings: any;
};

type TenantCtx = {
  tenant: Tenant | null;
  role: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<TenantCtx>({ tenant: null, role: null, loading: true, refresh: async () => {} });

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setTenant(null); setRole(null); setLoading(false); return; }
    setLoading(true);
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role, tenant_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!roleRow) { setTenant(null); setRole(null); setLoading(false); return; }
    setRole(roleRow.role);
    const { data: t } = await supabase.from("tenants").select("*").eq("id", roleRow.tenant_id).maybeSingle();
    setTenant((t as Tenant) ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  return <Ctx.Provider value={{ tenant, role, loading, refresh: load }}>{children}</Ctx.Provider>;
};

export const useTenant = () => useContext(Ctx);
