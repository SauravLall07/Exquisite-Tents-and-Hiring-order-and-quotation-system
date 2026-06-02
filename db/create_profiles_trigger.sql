-- Run this once in the Supabase SQL editor.
-- Creates a profile row automatically whenever a new auth user is created.
-- SECURITY DEFINER means it runs as the DB owner, bypassing RLS.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_staff)
  VALUES (NEW.id, NEW.email, NULL, FALSE)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
