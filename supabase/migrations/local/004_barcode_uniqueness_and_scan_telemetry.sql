-- Enforce barcode uniqueness per tenant for non-empty barcode values.
DROP INDEX IF EXISTS public.idx_products_barcode;
CREATE UNIQUE INDEX IF NOT EXISTS uq_products_tenant_barcode_nonempty
  ON public.products (tenant_id, barcode)
  WHERE barcode IS NOT NULL AND btrim(barcode) <> '';

-- Scanner telemetry events for operations monitoring and scanner QA.
CREATE TABLE IF NOT EXISTS public.scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  scanned_code TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure')),
  source TEXT NOT NULL DEFAULT 'camera' CHECK (source IN ('camera', 'manual')),
  device_id TEXT,
  device_label TEXT,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_events_tenant_created
  ON public.scan_events (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_events_status
  ON public.scan_events (tenant_id, status, created_at DESC);

