-- Run once in Supabase SQL editor to add order status tracking.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','confirmed','in_progress','completed','cancelled'));
