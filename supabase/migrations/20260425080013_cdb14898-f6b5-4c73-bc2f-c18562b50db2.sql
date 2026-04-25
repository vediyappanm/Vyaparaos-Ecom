-- Tenant invites table
CREATE TABLE public.tenant_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role public.app_role not null default 'cashier',
  code text not null unique,
  email text,
  note text,
  created_by uuid not null,
  accepted_by uuid,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

CREATE INDEX idx_tenant_invites_tenant ON public.tenant_invites(tenant_id);
CREATE INDEX idx_tenant_invites_code ON public.tenant_invites(code);

ALTER TABLE public.tenant_invites ENABLE ROW LEVEL SECURITY;

-- Managers (and owners) of the tenant can view, create, update, delete their invites
CREATE POLICY "managers view invites" ON public.tenant_invites
  FOR SELECT USING (public.can_manage_tenant(auth.uid(), tenant_id));

CREATE POLICY "managers create invites" ON public.tenant_invites
  FOR INSERT WITH CHECK (public.can_manage_tenant(auth.uid(), tenant_id) AND created_by = auth.uid());

CREATE POLICY "managers delete invites" ON public.tenant_invites
  FOR DELETE USING (public.can_manage_tenant(auth.uid(), tenant_id));

-- Any authenticated user can lookup invite by code (will be filtered by code in queries)
CREATE POLICY "anyone authenticated can lookup invite" ON public.tenant_invites
  FOR SELECT TO authenticated
  USING (accepted_at IS NULL AND expires_at > now());

-- Redeem invite: callable by any authenticated user with valid code
CREATE OR REPLACE FUNCTION public.redeem_invite(_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.tenant_invites%ROWTYPE;
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_invite FROM public.tenant_invites
  WHERE code = _code AND accepted_at IS NULL AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- Insert role (idempotent: ignore if already a member)
  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (v_user, v_invite.tenant_id, v_invite.role)
  ON CONFLICT DO NOTHING;

  UPDATE public.tenant_invites
  SET accepted_by = v_user, accepted_at = now()
  WHERE id = v_invite.id;

  RETURN v_invite.tenant_id;
END;
$$;

-- Allow members to view profile basics of co-members in their tenant (for staff list)
CREATE POLICY "view co-member profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur1
      JOIN public.user_roles ur2 ON ur1.tenant_id = ur2.tenant_id
      WHERE ur1.user_id = auth.uid() AND ur2.user_id = profiles.id
    )
  );