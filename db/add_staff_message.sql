-- Migration: add staff message field to orders
-- Run in Supabase SQL editor

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS staff_message text;
