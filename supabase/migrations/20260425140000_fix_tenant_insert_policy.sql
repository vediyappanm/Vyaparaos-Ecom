-- Fix tenant creation policy to allow authenticated users to create tenants
-- This is needed for onboarding where users create their first tenant
DROP POLICY IF EXISTS "authenticated users can create tenant" ON public.tenants;
CREATE POLICY "authenticated users can create tenant" ON public.tenants FOR INSERT
  TO authenticated WITH CHECK (true);
