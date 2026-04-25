
-- ACCOUNTS
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'cash', -- cash | bank | upi | wallet
  balance NUMERIC NOT NULL DEFAULT 0,
  account_number TEXT,
  ifsc TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view accounts" ON public.accounts FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "managers write accounts" ON public.accounts FOR INSERT WITH CHECK (can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers update accounts" ON public.accounts FOR UPDATE USING (can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers delete accounts" ON public.accounts FOR DELETE USING (can_manage_tenant(auth.uid(), tenant_id));
CREATE TRIGGER trg_accounts_updated BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- receipt | payment | expense | income
  party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
  party_name TEXT,
  category TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  mode TEXT, -- Cash | UPI | Card | NEFT | Cheque
  notes TEXT,
  reference TEXT, -- e.g. order id, purchase id
  txn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view transactions" ON public.transactions FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "members insert transactions" ON public.transactions FOR INSERT WITH CHECK (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "managers update transactions" ON public.transactions FOR UPDATE USING (can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers delete transactions" ON public.transactions FOR DELETE USING (can_manage_tenant(auth.uid(), tenant_id));
CREATE INDEX idx_txn_tenant_date ON public.transactions(tenant_id, txn_date DESC);

-- STOCK MOVEMENTS
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  type TEXT NOT NULL, -- purchase | sale | adjustment | return | damage
  qty NUMERIC NOT NULL DEFAULT 0, -- signed
  reference TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view stock_movements" ON public.stock_movements FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "members insert stock_movements" ON public.stock_movements FOR INSERT WITH CHECK (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "managers update stock_movements" ON public.stock_movements FOR UPDATE USING (can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers delete stock_movements" ON public.stock_movements FOR DELETE USING (can_manage_tenant(auth.uid(), tenant_id));
CREATE INDEX idx_mov_tenant_date ON public.stock_movements(tenant_id, created_at DESC);

-- PURCHASES
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  purchase_number TEXT NOT NULL,
  vendor_id UUID REFERENCES public.parties(id) ON DELETE SET NULL,
  vendor_name TEXT NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'received', -- draft | received | partial | paid
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view purchases" ON public.purchases FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "managers write purchases" ON public.purchases FOR INSERT WITH CHECK (can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers update purchases" ON public.purchases FOR UPDATE USING (can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers delete purchases" ON public.purchases FOR DELETE USING (can_manage_tenant(auth.uid(), tenant_id));
CREATE TRIGGER trg_purchases_updated BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  qty NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view purchase_items" ON public.purchase_items FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "managers write purchase_items" ON public.purchase_items FOR INSERT WITH CHECK (can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers update purchase_items" ON public.purchase_items FOR UPDATE USING (can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers delete purchase_items" ON public.purchase_items FOR DELETE USING (can_manage_tenant(auth.uid(), tenant_id));

-- STAFF (business roster, separate from auth)
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Helper',
  salary NUMERIC NOT NULL DEFAULT 0,
  join_date DATE,
  status TEXT NOT NULL DEFAULT 'active', -- active | on_leave | inactive
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view staff" ON public.staff FOR SELECT USING (is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "managers write staff" ON public.staff FOR INSERT WITH CHECK (can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers update staff" ON public.staff FOR UPDATE USING (can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "managers delete staff" ON public.staff FOR DELETE USING (can_manage_tenant(auth.uid(), tenant_id));
CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
