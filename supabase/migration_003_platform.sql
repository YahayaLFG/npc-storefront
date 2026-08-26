-- ============================================================
-- NPC — migration 003: warehouse platform
-- Customer accounts with roles, the full order lifecycle, personal
-- warehouse items, shipments, notifications, and product authenticity
-- labels.
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  email text default '',
  full_name text default '',
  phone text default '',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can read own profile" on profiles;
create policy "Users can read own profile"
  on profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Admins can read all profiles" on profiles;
create policy "Admins can read all profiles"
  on profiles for select
  to authenticated
  using (is_admin());

-- Auto-create a profile row whenever someone signs up. Everyone defaults
-- to 'customer' — to make your existing admin account an admin, run once:
--   update profiles set role = 'admin' where id = '<your-admin-user-id>';
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,

  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_image text,
  variant_color text,
  variant_size text,
  quantity int not null default 1,
  product_price numeric not null,

  status text not null default 'to_pay' check (status in (
    'to_pay', 'pending_purchase', 'purchased', 'seller_shipped',
    'warehouse_received', 'stored', 'ready_to_ship', 'packing',
    'in_transit', 'customs', 'delivered'
  )),

  payment_reference text default '',
  admin_note text default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_idx on orders (customer_id);
create index if not exists orders_status_idx on orders (status);

drop trigger if exists orders_set_updated_at on orders;
create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

alter table orders enable row level security;

drop policy if exists "Customers can read own orders" on orders;
create policy "Customers can read own orders"
  on orders for select
  to authenticated
  using (customer_id = auth.uid() or is_admin());

drop policy if exists "Customers can create own orders" on orders;
create policy "Customers can create own orders"
  on orders for insert
  to authenticated
  with check (customer_id = auth.uid());

-- Narrow: a customer's own payment-confirmation flow can ONLY ever move
-- their order from to_pay -> pending_purchase, nothing else.
drop policy if exists "Customers can update own order payment ref" on orders;
create policy "Customers can update own order payment ref"
  on orders for update
  to authenticated
  using (customer_id = auth.uid() and status = 'to_pay')
  with check (customer_id = auth.uid() and status = 'pending_purchase');

drop policy if exists "Admins can update any order" on orders;
create policy "Admins can update any order"
  on orders for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create table if not exists warehouse_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  customer_id uuid not null references profiles(id) on delete cascade,

  photos text[] default '{}',
  weight_kg numeric,
  length_cm numeric,
  width_cm numeric,
  height_cm numeric,

  received_at timestamptz not null default now(),
  free_storage_days int not null default 7,
  extended_days int not null default 0,

  shipment_id uuid,

  created_at timestamptz not null default now()
);

create index if not exists warehouse_items_customer_idx on warehouse_items (customer_id);
create index if not exists warehouse_items_order_idx on warehouse_items (order_id);

alter table warehouse_items enable row level security;

drop policy if exists "Customers can read own warehouse items" on warehouse_items;
create policy "Customers can read own warehouse items"
  on warehouse_items for select
  to authenticated
  using (customer_id = auth.uid() or is_admin());

drop policy if exists "Admins can manage warehouse items" on warehouse_items;
create policy "Admins can manage warehouse items"
  on warehouse_items for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- Customers do NOT get a broad UPDATE grant on warehouse_items (would let
-- a crafted request change weight/dimensions and under-report shipping
-- cost). "Extend storage" goes through this narrow function instead.
create or replace function extend_warehouse_storage(item_id uuid, extra_days int)
returns void
language plpgsql
security definer
as $$
begin
  if extra_days <= 0 or extra_days > 90 then
    raise exception 'Invalid extension length.';
  end if;

  update warehouse_items
  set extended_days = extended_days + extra_days
  where id = item_id and customer_id = auth.uid();

  if not found then
    raise exception 'Item not found or not yours.';
  end if;
end;
$$;

grant execute on function extend_warehouse_storage(uuid, int) to authenticated;

create or replace function assign_items_to_shipment(item_ids uuid[], target_shipment_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  shipment_owner uuid;
begin
  select customer_id into shipment_owner from shipments where id = target_shipment_id;
  if shipment_owner is null or shipment_owner != auth.uid() then
    raise exception 'Shipment not found or not yours.';
  end if;

  update warehouse_items
  set shipment_id = target_shipment_id
  where id = any(item_ids)
    and customer_id = auth.uid()
    and shipment_id is null;
end;
$$;

grant execute on function assign_items_to_shipment(uuid[], uuid) to authenticated;

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,

  courier text not null default 'Standard',
  shipping_cost numeric not null default 0,
  total_weight_kg numeric not null default 0,

  status text not null default 'packing' check (status in (
    'packing', 'in_transit', 'customs', 'delivered'
  )),
  tracking_number text default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists shipments_set_updated_at on shipments;
create trigger shipments_set_updated_at
  before update on shipments
  for each row execute function set_updated_at();

alter table warehouse_items
  add constraint warehouse_items_shipment_fk
  foreign key (shipment_id) references shipments(id) on delete set null;

alter table shipments enable row level security;

drop policy if exists "Customers can read own shipments" on shipments;
create policy "Customers can read own shipments"
  on shipments for select
  to authenticated
  using (customer_id = auth.uid() or is_admin());

drop policy if exists "Customers can create own shipments" on shipments;
create policy "Customers can create own shipments"
  on shipments for insert
  to authenticated
  with check (customer_id = auth.uid());

drop policy if exists "Admins can manage shipments" on shipments;
create policy "Admins can manage shipments"
  on shipments for update
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admins can create shipments" on shipments;
create policy "Admins can create shipments"
  on shipments for insert
  to authenticated
  with check (is_admin());

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references profiles(id) on delete cascade,
  type text not null default 'order_status',
  title text not null,
  message text not null,
  related_order_id uuid references orders(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_customer_idx on notifications (customer_id, read);

alter table notifications enable row level security;

drop policy if exists "Customers can read own notifications" on notifications;
create policy "Customers can read own notifications"
  on notifications for select
  to authenticated
  using (customer_id = auth.uid() or is_admin());

drop policy if exists "Customers can mark own notifications read" on notifications;
create policy "Customers can mark own notifications read"
  on notifications for update
  to authenticated
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

drop policy if exists "Admins can create notifications" on notifications;
create policy "Admins can create notifications"
  on notifications for insert
  to authenticated
  with check (is_admin());
