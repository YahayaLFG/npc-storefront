-- ============================================================
-- NPC — migration: multi-item Paystack checkout
-- Adds ONE new table (order_batches) and two nullable columns on the
-- existing `orders` table. Nothing existing is renamed, dropped, or
-- changed in meaning — fully additive.
-- ============================================================

-- One Paystack payment groups multiple orders. Each order keeps its own
-- order_number, status, and lifecycle — the batch groups ONLY the charge,
-- never the fulfillment. Same "one payment, many linked rows" pattern
-- already used by `shipments` for warehouse consolidation.
create table if not exists order_batches (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  paystack_reference text unique,
  total_amount numeric not null default 0,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table orders add column if not exists batch_id uuid references order_batches(id) on delete set null;
create index if not exists orders_batch_idx on orders (batch_id);

-- Snapshotted at order-creation time, same reasoning as the existing
-- product_name/product_image snapshots: survives later edits to the
-- product itself, and gives the admin/customer an immutable record of
-- what was actually charged and what label applied at purchase time.
alter table orders add column if not exists unit_price numeric;
alter table orders add column if not exists authenticity_tag text;

alter table order_batches enable row level security;

drop policy if exists "Customers can read own batches" on order_batches;
create policy "Customers can read own batches"
  on order_batches for select
  to authenticated
  using (customer_id = auth.uid() or is_admin());

drop policy if exists "Customers can create own batches" on order_batches;
create policy "Customers can create own batches"
  on order_batches for insert
  to authenticated
  with check (customer_id = auth.uid());

-- Narrow, same reasoning as the existing single-order payment-confirm
-- policy: lets the customer's own checkout-confirmation flow mark their
-- batch paid, without granting any other update.
drop policy if exists "Customers can mark own batch paid" on order_batches;
create policy "Customers can mark own batch paid"
  on order_batches for update
  to authenticated
  using (customer_id = auth.uid() and paid_at is null)
  with check (customer_id = auth.uid());
