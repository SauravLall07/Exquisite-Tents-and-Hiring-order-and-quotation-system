-- Migration: add tent dimensions and site measurement flag to orders
-- Run in Supabase SQL editor

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tent_width     numeric,
  ADD COLUMN IF NOT EXISTS tent_length    numeric,
  ADD COLUMN IF NOT EXISTS needs_measurement boolean DEFAULT false;
