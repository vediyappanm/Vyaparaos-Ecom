-- 1) Storage bucket for product/logo uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: tenant members can upload to <tenant_id>/* path
CREATE POLICY "uploads public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

CREATE POLICY "uploads members insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'uploads'
  AND public.is_tenant_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "uploads members update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'uploads'
  AND public.is_tenant_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "uploads members delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'uploads'
  AND public.is_tenant_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- 2) Audit log
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  user_name text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  summary text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_tenant_created ON public.audit_log(tenant_id, created_at DESC);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "managers view audit" ON public.audit_log FOR SELECT
  USING (public.can_manage_tenant(auth.uid(), tenant_id));
CREATE POLICY "members insert audit" ON public.audit_log FOR INSERT
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));

-- 3) Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid,
  type text NOT NULL, -- 'low_stock' | 'new_order' | 'payment_due' | 'system'
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_tenant_created ON public.notifications(tenant_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view notifications" ON public.notifications FOR SELECT
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "members insert notifications" ON public.notifications FOR INSERT
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "members update notifications" ON public.notifications FOR UPDATE
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "members delete notifications" ON public.notifications FOR DELETE
  USING (public.is_tenant_member(auth.uid(), tenant_id));

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 4) Public RPC: place a storefront order (unauthenticated customer)
CREATE OR REPLACE FUNCTION public.place_storefront_order(
  _slug text,
  _customer_name text,
  _customer_phone text,
  _customer_address text,
  _items jsonb,
  _notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant public.tenants%ROWTYPE;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_tax numeric := 0;
  v_total numeric := 0;
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_qty numeric;
  v_line_total numeric;
  v_line_tax numeric;
BEGIN
  IF _customer_name IS NULL OR length(trim(_customer_name)) < 2 THEN
    RAISE EXCEPTION 'Customer name required';
  END IF;
  IF _customer_phone IS NULL OR length(regexp_replace(_customer_phone,'\D','','g')) < 7 THEN
    RAISE EXCEPTION 'Valid phone required';
  END IF;
  IF jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  SELECT * INTO v_tenant FROM public.tenants WHERE slug = _slug;
  IF NOT FOUND THEN RAISE EXCEPTION 'Store not found'; END IF;

  v_order_number := 'WEB-' || to_char(now(),'YYMMDD') || '-' || lpad(floor(random()*9999)::int::text,4,'0');

  INSERT INTO public.orders (tenant_id, order_number, channel, status, payment_status,
    party_name, party_phone, notes, subtotal, tax_amount, total, balance_due)
  VALUES (v_tenant.id, v_order_number, 'storefront', 'pending', 'unpaid',
    _customer_name, _customer_phone, COALESCE(_notes,'') || E'\nAddress: ' || COALESCE(_customer_address,''),
    0, 0, 0, 0)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    SELECT * INTO v_product FROM public.products
      WHERE id = (v_item->>'product_id')::uuid AND tenant_id = v_tenant.id AND is_active = true;
    IF NOT FOUND THEN CONTINUE; END IF;
    v_qty := GREATEST(1, COALESCE((v_item->>'qty')::numeric, 1));
    v_line_total := v_product.price * v_qty;
    v_line_tax := v_line_total * v_product.tax_rate / 100;

    INSERT INTO public.order_items (tenant_id, order_id, product_id, product_name, hsn_code,
      qty, unit_price, tax_rate, tax_amount, total)
    VALUES (v_tenant.id, v_order_id, v_product.id, v_product.name, v_product.hsn_code,
      v_qty, v_product.price, v_product.tax_rate, v_line_tax, v_line_total + v_line_tax);

    v_subtotal := v_subtotal + v_line_total;
    v_tax := v_tax + v_line_tax;
  END LOOP;

  v_total := v_subtotal + v_tax;
  UPDATE public.orders
    SET subtotal = v_subtotal, tax_amount = v_tax, total = v_total, balance_due = v_total
    WHERE id = v_order_id;

  -- Notify tenant members
  INSERT INTO public.notifications (tenant_id, type, title, body, link)
  VALUES (v_tenant.id, 'new_order', 'New online order #' || v_order_number,
    _customer_name || ' placed an order for ₹' || to_char(v_total,'FM999999990.00'),
    '/admin/orders');

  RETURN jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number, 'total', v_total);
END $$;

GRANT EXECUTE ON FUNCTION public.place_storefront_order(text,text,text,text,jsonb,text) TO anon, authenticated;

-- 5) Public RPC: customer tracks their order
CREATE OR REPLACE FUNCTION public.track_storefront_order(
  _slug text, _order_number text, _phone text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_tenant public.tenants%ROWTYPE; v_order public.orders%ROWTYPE; v_items jsonb;
BEGIN
  SELECT * INTO v_tenant FROM public.tenants WHERE slug = _slug;
  IF NOT FOUND THEN RAISE EXCEPTION 'Store not found'; END IF;

  SELECT * INTO v_order FROM public.orders
    WHERE tenant_id = v_tenant.id
      AND order_number = _order_number
      AND regexp_replace(COALESCE(party_phone,''),'\D','','g')
        = regexp_replace(_phone,'\D','','g');
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'product_name', product_name, 'qty', qty, 'unit_price', unit_price, 'total', total
  )), '[]'::jsonb) INTO v_items
  FROM public.order_items WHERE order_id = v_order.id;

  RETURN jsonb_build_object(
    'order_number', v_order.order_number,
    'status', v_order.status,
    'payment_status', v_order.payment_status,
    'total', v_order.total,
    'created_at', v_order.created_at,
    'party_name', v_order.party_name,
    'items', v_items,
    'tenant_name', v_tenant.name,
    'tenant_phone', v_tenant.phone
  );
END $$;

GRANT EXECUTE ON FUNCTION public.track_storefront_order(text,text,text) TO anon, authenticated;