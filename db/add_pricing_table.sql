-- Stores all configurable pricing in a single JSONB config row.
-- Staff can update it via the Admin → Pricing page.

CREATE TABLE IF NOT EXISTS public.pricing (
  id         TEXT        PRIMARY KEY DEFAULT 'default',
  config     JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.pricing (id, config)
VALUES ('default', '{
  "tents":       {"frame": 150, "stretch": 300, "peg_pole": 180, "bedouin": 350, "marquee": 480},
  "extras":      {"lighting": 50, "flooring": 120, "heaters": 80},
  "perGuest":    2.0,
  "chairPrice":  1.5,
  "tablePrice":  8.0,
  "deliveryFee": 60,
  "siteVisitFee": 350,
  "taxRate":     0.12
}')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pricing"
ON public.pricing FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Staff can upsert pricing"
ON public.pricing FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_staff = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_staff = true)
);
