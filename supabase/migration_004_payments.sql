-- ============================================================
-- NPC — migration 004: payments
-- Order numbers and Paystack payment reference tracking.
-- ============================================================

alter table orders add column if not exists order_number text unique;
alter table orders add column if not exists paystack_reference text unique;
alter table orders add column if not exists paid_at timestamptz;

alter table shipments add column if not exists paystack_reference text unique;
alter table shipments add column if not exists paid_at timestamptz;

create index if not exists orders_order_number_idx on orders (order_number);
create index if not exists orders_paystack_reference_idx on orders (paystack_reference);
create index if not exists shipments_paystack_reference_idx on shipments (paystack_reference);
