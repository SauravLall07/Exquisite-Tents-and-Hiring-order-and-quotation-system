-- Payment tracking fields for orders.
-- deposit_required: amount staff sets as required deposit (nullable until set)
-- deposit_paid:     whether the deposit has been received
-- payment_status:   overall payment state

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS deposit_required NUMERIC,
  ADD COLUMN IF NOT EXISTS deposit_paid     BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_status   TEXT     NOT NULL DEFAULT 'unpaid';

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('unpaid', 'deposit_paid', 'fully_paid'));
