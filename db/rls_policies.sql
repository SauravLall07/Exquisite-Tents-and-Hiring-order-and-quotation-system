-- Row Level Security policies
-- Run in Supabase SQL editor.

-- ────────────────────────────────────────────────────────────────────────────
-- Helper: is_staff()
-- SECURITY DEFINER bypasses RLS so it can read profiles without recursion.
-- All policies that need to know "is the caller staff?" use this function.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_staff = true
  );
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- profiles table
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  email text,
  is_staff boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; staff can read all profiles.
DROP POLICY IF EXISTS "Profiles can select" ON public.profiles;
CREATE POLICY "Profiles can select" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (id = auth.uid() OR public.is_staff())
  );

-- Any authenticated user can create their own profile row (id must equal their uid).
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert profiles (staff)" ON public.profiles;
CREATE POLICY "Allow insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND id = auth.uid()
  );

-- Only staff can update any profile.
DROP POLICY IF EXISTS "Profiles can update" ON public.profiles;
CREATE POLICY "Profiles can update" ON public.profiles
  FOR UPDATE
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Only staff can delete profiles.
DROP POLICY IF EXISTS "Profiles can delete" ON public.profiles;
CREATE POLICY "Profiles can delete" ON public.profiles
  FOR DELETE
  USING (public.is_staff());

-- ────────────────────────────────────────────────────────────────────────────
-- orders table
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Anyone (including anonymous users) can submit an order.
DROP POLICY IF EXISTS "Allow insert from web" ON public.orders;
CREATE POLICY "Allow insert from web" ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Staff can read all orders.
DROP POLICY IF EXISTS "Staff can select orders" ON public.orders;
CREATE POLICY "Staff can select orders" ON public.orders
  FOR SELECT
  USING (public.is_staff());

-- Authenticated customers can read their own orders.
DROP POLICY IF EXISTS "Customers can select own orders" ON public.orders;
CREATE POLICY "Customers can select own orders" ON public.orders
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- Only staff can update orders.
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
CREATE POLICY "Staff can update orders" ON public.orders
  FOR UPDATE
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Authenticated customers can update their own orders.
DROP POLICY IF EXISTS "Customers can update own orders" ON public.orders;
CREATE POLICY "Customers can update own orders" ON public.orders
  FOR UPDATE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Only staff can delete orders.
DROP POLICY IF EXISTS "Staff can delete orders" ON public.orders;
CREATE POLICY "Staff can delete orders" ON public.orders
  FOR DELETE
  USING (public.is_staff());
