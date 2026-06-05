-- Migration: add event date fields to orders
-- Run in Supabase SQL editor

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS event_date     date,
  ADD COLUMN IF NOT EXISTS event_end_date date;

CREATE INDEX IF NOT EXISTS idx_orders_event_date ON public.orders (event_date);
