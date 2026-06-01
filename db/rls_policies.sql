-- Row Level Security policies for `orders`
-- Run in Supabase SQL editor.

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous web users) to INSERT orders (customers submitting forms)
DROP POLICY IF EXISTS "Allow insert from web" ON public.orders;
CREATE POLICY "Allow insert from web" ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Add user_id column to link orders to authenticated users (optional)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Create a simple `profiles` table to mark staff users (if you use Supabase Auth, set id = auth.users.id)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  email text,
  is_staff boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles and restrict management to staff
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Only staff can INSERT profiles (bootstrapping must be done via the SQL editor or service role)
DROP POLICY IF EXISTS "Allow insert profiles (staff)" ON public.profiles;
CREATE POLICY "Allow insert profiles (staff)" ON public.profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff = true)
  );

-- Allow authenticated users to INSERT (create) their OWN profile (id must equal auth.uid())
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
CREATE POLICY "Allow insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND id = auth.uid()
  );

-- Allow staff or a user to SELECT their own profile
DROP POLICY IF EXISTS "Profiles can select" ON public.profiles;
CREATE POLICY "Profiles can select" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff = true))
  );

-- Only staff can UPDATE profiles
DROP POLICY IF EXISTS "Profiles can update" ON public.profiles;
CREATE POLICY "Profiles can update" ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff = true)
  );

-- Only staff can DELETE profiles
DROP POLICY IF EXISTS "Profiles can delete" ON public.profiles;
CREATE POLICY "Profiles can delete" ON public.profiles
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff = true)
  );

-- Allow only staff (profiles.is_staff = true) to SELECT orders
DROP POLICY IF EXISTS "Staff can select orders" ON public.orders;
CREATE POLICY "Staff can select orders" ON public.orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff = true
    )
  );

-- Allow authenticated customers to SELECT their own orders
DROP POLICY IF EXISTS "Customers can select own orders" ON public.orders;
CREATE POLICY "Customers can select own orders" ON public.orders
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- Allow only staff to UPDATE orders
DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
CREATE POLICY "Staff can update orders" ON public.orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff = true
    )
  );

-- Allow authenticated customers to UPDATE their own orders
DROP POLICY IF EXISTS "Customers can update own orders" ON public.orders;
CREATE POLICY "Customers can update own orders" ON public.orders
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- Allow only staff to DELETE orders
DROP POLICY IF EXISTS "Staff can delete orders" ON public.orders;
CREATE POLICY "Staff can delete orders" ON public.orders
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_staff = true
    )
  );

-- Notes:
-- 1) After running this, create `profiles` rows for staff users using their auth.user id as `id`.
-- 2) If you prefer authenticated users to be able to read their own orders, add a policy using `auth.uid()` to match a `user_id` column on `orders`.
