DROP POLICY "any authenticated can create tenant" ON public.tenants;
CREATE POLICY "authenticated users can create tenant" ON public.tenants FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);