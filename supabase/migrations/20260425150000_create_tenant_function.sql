-- Create a security definer function to handle tenant creation
-- This bypasses RLS for authenticated users creating their first tenant
CREATE OR REPLACE FUNCTION public.create_tenant(
  _name TEXT,
  _slug TEXT,
  _gstin TEXT DEFAULT NULL,
  _phone TEXT DEFAULT NULL,
  _email TEXT DEFAULT NULL,
  _address TEXT DEFAULT NULL,
  _city TEXT DEFAULT NULL,
  _state TEXT DEFAULT NULL,
  _pincode TEXT DEFAULT NULL,
  _logo_url TEXT DEFAULT NULL,
  _currency TEXT DEFAULT 'INR',
  _settings JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.tenants (
    name, slug, gstin, phone, email, address, city, state, pincode, logo_url, currency, settings
  ) VALUES (
    _name, _slug, _gstin, _phone, _email, _address, _city, _state, _pincode, _logo_url, _currency, _settings
  )
  RETURNING id INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_tenant TO authenticated;
