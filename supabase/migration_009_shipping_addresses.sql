-- ============================================================
-- NPC — migration 009: shipping addresses
-- Reusable saved addresses + a frozen snapshot on order_batches so
-- editing/deleting a saved address later never alters a historical order.
-- ============================================================

create table if not exists shipping_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  full_name text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text default '',
  state text not null,
  city text not null,
  area text default '',
  postal_code text default '',
  country text not null default 'Nigeria',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipping_addresses_user_idx on shipping_addresses (user_id);

drop trigger if exists shipping_addresses_set_updated_at on shipping_addresses;
create trigger shipping_addresses_set_updated_at
  before update on shipping_addresses
  for each row execute function set_updated_at();

alter table shipping_addresses enable row level security;

-- Customer: full CRUD, strictly on their own rows. No admin clause here
-- at all — admin write access is intentionally NOT granted (see below).
drop policy if exists "Customers manage own addresses" on shipping_addresses;
create policy "Customers manage own addresses"
  on shipping_addresses for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admin: read-only, for fulfillment lookup. Deliberately NOT for
-- all/update/delete — admins should never be able to alter or remove a
-- customer's saved address.
drop policy if exists "Admins can read all addresses" on shipping_addresses;
create policy "Admins can read all addresses"
  on shipping_addresses for select to authenticated
  using (is_admin());

-- Frozen snapshot on the checkout event (one per checkout, not per line
-- item). shipping_address_id is just a traceability pointer; the jsonb
-- column is the permanent copy the order actually displays.
alter table order_batches add column if not exists shipping_address jsonb not null default '{}';
alter table order_batches add column if not exists shipping_address_id uuid references shipping_addresses(id) on delete set null;
