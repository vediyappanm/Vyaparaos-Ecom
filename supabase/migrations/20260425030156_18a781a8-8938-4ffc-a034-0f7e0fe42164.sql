-- Enums
CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'cashier', 'staff');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'partial', 'paid');
CREATE TYPE public.party_type AS ENUM ('customer', 'vendor');

-- Updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- TENANTS
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  gstin TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- USER_ROLES (separate table — never on profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_tenant ON public.user_roles(tenant_id);

-- Security definer helpers (avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _tenant_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND tenant_id = _tenant_id
  )
$$;

CREATE OR REPLACE FUNCTION public.can_manage_tenant(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND role IN ('owner','manager')
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sku TEXT,
  barcode TEXT,
  hsn_code TEXT,
  unit TEXT NOT NULL DEFAULT 'piece',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  mrp NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  stock_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
  low_stock_alert NUMERIC(12,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_products_tenant ON public.products(tenant_id);
CREATE INDEX idx_products_barcode ON public.products(tenant_id, barcode);
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PARTIES
CREATE TABLE public.parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type public.party_type NOT NULL DEFAULT 'customer',
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  gstin TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_parties_tenant ON public.parties(tenant_id);
CREATE TRIGGER trg_parties_updated BEFORE UPDATE ON public.parties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
  party_name TEXT,
  party_phone TEXT,
  status public.order_status NOT NULL DEFAULT 'confirmed',
  channel TEXT NOT NULL DEFAULT 'pos',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status public.payment_status NOT NULL DEFAULT 'paid',
  payment_mode TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, order_number)
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_orders_tenant ON public.orders(tenant_id);
CREATE INDEX idx_orders_created ON public.orders(tenant_id, created_at DESC);
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  hsn_code TEXT,
  qty NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_tenant ON public.order_items(tenant_id);

-- RLS POLICIES

-- profiles
CREATE POLICY "view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- tenants
CREATE POLICY "members can view tenant" ON public.tenants FOR SELECT
  USING (public.is_tenant_member(auth.uid(), id));
CREATE POLICY "any authenticated can create tenant" ON public.tenants FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "owners can update tenant" ON public.tenants FOR UPDATE
  USING (public.has_role(auth.uid(), id, 'owner'));
CREATE POLICY "owners can delete tenant" ON public.tenants FOR DELETE
  USING (public.has_role(auth.uid(), id, 'owner'));

-- user_roles
CREATE POLICY "view own roles" ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), tenant_id, 'owner'));
CREATE POLICY "insert role on owned tenant or self-bootstrap" ON public.user_roles FOR INSERT
  WITH CHECK (
    -- bootstrap: user assigning themselves owner of a tenant they just created (only if no roles exist yet for that tenant)
    (user_id = auth.uid() AND role = 'owner' AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.tenant_id = user_roles.tenant_id))
    OR public.has_role(auth.uid(), tenant_id, 'owner')
  );
CREATE POLICY "owners can update roles" ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), tenant_id, 'owner'));
CREATE POLICY "owners can delete roles" ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), tenant_id, 'owner'));

-- products
CREATE POLICY "members view products" ON public.products FOR SELECT
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "managers write products" ON public.products FOR INSERT
  WITH CHECK (public.can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers update products" ON public.products FOR UPDATE
  USING (public.can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers delete products" ON public.products FOR DELETE
  USING (public.can_manage_tenant(auth.uid(), tenant_id));

-- parties
CREATE POLICY "members view parties" ON public.parties FOR SELECT
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "members insert parties" ON public.parties FOR INSERT
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "managers update parties" ON public.parties FOR UPDATE
  USING (public.can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers delete parties" ON public.parties FOR DELETE
  USING (public.can_manage_tenant(auth.uid(), tenant_id));

-- orders
CREATE POLICY "members view orders" ON public.orders FOR SELECT
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "members insert orders" ON public.orders FOR INSERT
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "managers update orders" ON public.orders FOR UPDATE
  USING (public.can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers delete orders" ON public.orders FOR DELETE
  USING (public.can_manage_tenant(auth.uid(), tenant_id));

-- order_items
CREATE POLICY "members view order_items" ON public.order_items FOR SELECT
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "members insert order_items" ON public.order_items FOR INSERT
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "managers update order_items" ON public.order_items FOR UPDATE
  USING (public.can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers delete order_items" ON public.order_items FOR DELETE
  USING (public.can_manage_tenant(auth.uid(), tenant_id));