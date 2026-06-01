-- Create orders table for Exquisite Tents & Hiring
-- Run in Supabase SQL editor or psql connected to the project's DB

-- Ensure UUID generator function is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  tent_type text,
  guest_count integer,
  chairs integer,
  tables integer,
  extras jsonb,
  delivery boolean DEFAULT false,
  notes text,
  quote jsonb,
  created_at timestamptz DEFAULT now()
);

-- optional index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

-- Example insert (replace values or remove)
-- INSERT INTO public.orders (name, email, phone, tent_type, guest_count, chairs, tables, extras, delivery, notes, quote)
-- VALUES ('Jane Doe', 'jane@example.com', '07123456789', 'medium', 80, 80, 16, '{"lighting": true}', true, 'Near park entrance', '{"total": 1234.56}');
