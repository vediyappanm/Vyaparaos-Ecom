import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant, type AppRole } from "@/contexts/TenantContext";

export type DbInvite = {
  id: string;
  tenant_id: string;
  role: AppRole;
  code: string;
  email: string | null;
  note: string | null;
  created_by: string;
  accepted_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

export type Member = {
  user_id: string;
  role: AppRole;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  joined_at: string;
};

const genCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s.slice(0, 4) + "-" + s.slice(4);
};

export const useInvites = () => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["invites", tenant?.id],
    enabled: !!tenant,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_invites" as any)
        .select("*")
        .eq("tenant_id", tenant!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DbInvite[];
    },
  });
};

export const useCreateInvite = () => {
  const qc = useQueryClient();
  const { tenant } = useTenant();
  return useMutation({
    mutationFn: async (input: { role: AppRole; email?: string; note?: string }) => {
      if (!tenant) throw new Error("No tenant");
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("tenant_invites" as any)
        .insert({
          tenant_id: tenant.id,
          role: input.role,
          email: input.email ?? null,
          note: input.note ?? null,
          code: genCode(),
          created_by: u.user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as DbInvite;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invites"] }),
  });
};

export const useDeleteInvite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tenant_invites" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invites"] }),
  });
};

export const useMembers = () => {
  const { tenant } = useTenant();
  return useQuery({
    queryKey: ["members", tenant?.id],
    enabled: !!tenant,
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at, profiles(full_name, avatar_url)")
        .eq("tenant_id", tenant!.id);
      if (error) throw error;
      return (roles ?? []).map((r: any) => ({
        user_id: r.user_id,
        role: r.role,
        full_name: r.profiles?.full_name ?? null,
        email: null,
        avatar_url: r.profiles?.avatar_url ?? null,
        joined_at: r.created_at,
      })) as Member[];
    },
  });
};

export const useUpdateMemberRole = () => {
  const qc = useQueryClient();
  const { tenant } = useTenant();
  return useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      if (!tenant) throw new Error("No tenant");
      const { error } = await supabase.from("user_roles").update({ role }).eq("tenant_id", tenant.id).eq("user_id", user_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
};

export const useRemoveMember = () => {
  const qc = useQueryClient();
  const { tenant } = useTenant();
  return useMutation({
    mutationFn: async (user_id: string) => {
      if (!tenant) throw new Error("No tenant");
      const { error } = await supabase.from("user_roles").delete().eq("tenant_id", tenant.id).eq("user_id", user_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
};

export const useRedeemInvite = () => {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc("redeem_invite" as any, { _code: code });
      if (error) throw error;
      return data as string; // tenant_id
    },
  });
};
