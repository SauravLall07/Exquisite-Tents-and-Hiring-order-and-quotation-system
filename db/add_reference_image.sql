-- Migration: add reference image URL to orders
-- Run in Supabase SQL editor

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS reference_image_url text;
