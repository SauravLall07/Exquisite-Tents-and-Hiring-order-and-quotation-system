-- Storage RLS policies for the order-images bucket
-- Run in Supabase SQL editor AFTER creating the bucket named "order-images"

-- Allow anyone (including anonymous customers) to upload images
CREATE POLICY "Public can upload order images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'order-images');

-- Allow anyone to read/view the images (needed to display them)
CREATE POLICY "Public can view order images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'order-images');
