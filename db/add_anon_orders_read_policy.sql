-- Allow anonymous (unauthenticated) customers to read orders
-- Required for the My Orders email-lookup page
-- The client always filters by email, so customers only see their own orders

CREATE POLICY "Anon customers can read orders"
ON public.orders
FOR SELECT
TO anon
USING (true);
