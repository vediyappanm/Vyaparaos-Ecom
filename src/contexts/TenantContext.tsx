import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
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

export type AppRole = "owner" | "manager" | "cashier" | "staff";

export type Membership = { tenant_id: string; role: AppRole; tenant_name: string };

type TenantCtx = {
  tenant: Tenant | null;
  role: AppRole | null;
  memberships: Membership[];
  loading: boolean;
  refresh: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  can: (action: "manage" | "view") => boolean;
  isOwner: boolean;
  isManager: boolean;
};

const Ctx = createContext<TenantCtx>({
  tenant: null, role: null, memberships: [], loading: true,
  refresh: async () => {}, switchTenant: async () => {},
  can: () => false, isOwner: false, isManager: false,
});

const ACTIVE_KEY = "vyaparos_active_tenant";

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTenant = useCallback(async (tenantId: string, all: Membership[]) => {
    const { data: t } = await supabase.from("tenants").select("*").eq("id", tenantId).maybeSingle();
    setTenant((t as Tenant) ?? null);
    const m = all.find((x) => x.tenant_id === tenantId);
    setRole((m?.role as AppRole) ?? null);
    if (t) localStorage.setItem(ACTIVE_KEY, tenantId);
  }, []);

  const load = useCallback(async () => {
    if (!user) { setTenant(null); setRole(null); setMemberships([]); setLoading(false); return; }
    setLoading(true);
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role, tenant_id, tenants(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    const all: Membership[] = (roleRows ?? []).map((r: any) => ({
      tenant_id: r.tenant_id, role: r.role, tenant_name: r.tenants?.name ?? "—",
    }));
    setMemberships(all);
    if (all.length === 0) { setTenant(null); setRole(null); setLoading(false); return; }
    const stored = localStorage.getItem(ACTIVE_KEY);
    const activeId = all.find((m) => m.tenant_id === stored)?.tenant_id ?? all[0].tenant_id;
    await loadTenant(activeId, all);
    setLoading(false);
  }, [user, loadTenant]);

  const switchTenant = useCallback(async (tenantId: string) => {
    setLoading(true);
    await loadTenant(tenantId, memberships);
    setLoading(false);
  }, [memberships, loadTenant]);

  useEffect(() => { load(); }, [load]);

  const isOwner = role === "owner";
  const isManager = role === "owner" || role === "manager";
  const can = (action: "manage" | "view") => action === "view" ? !!role : isManager;

  return (
    <Ctx.Provider value={{ tenant, role, memberships, loading, refresh: load, switchTenant, can, isOwner, isManager }}>
      {children}
    </Ctx.Provider>
  );
};

export const useTenant = () => useContext(Ctx);
