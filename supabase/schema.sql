-- ============================================================
-- NPC — base schema
-- Run this first, in a fresh Supabase project's SQL Editor.
-- ============================================================

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,

  supplier_title text default '',
  supplier_url text default '',
  supplier_price_cny numeric,
  supplier_price_ngn numeric,
  estimated_weight_kg numeric not null default 0,
  warehouse_shipping_cny numeric not null default 0,
  service_fee_cny numeric not null default 0,

  name text not null,
  description text default '',
  long_description text default '',
  collection text not null,
  category text not null,
  tags text[] default '{}',
  variants jsonb not null default '[]',
  size_guide jsonb,
  size_chart_image text,
  authenticity_tag text
    check (authenticity_tag in ('NPC Archive', 'NPC Studio', 'NPC Drop')),

  image text,
  gallery text[] default '{}',

  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  published boolean not null default true,

  price numeric,
  landed_cost numeric,
  expected_profit numeric,
  profit_margin numeric,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_published_idx on products (published);
create index if not exists products_collection_idx on products (collection);
create index if not exists products_category_idx on products (category);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

alter table products enable row level security;

drop policy if exists "Admins can read all products" on products;
create policy "Admins can read all products"
  on products for select
  to authenticated
  using (true);

drop policy if exists "Admins can insert products" on products;
create policy "Admins can insert products"
  on products for insert
  to authenticated
  with check (true);

drop policy if exists "Admins can update products" on products;
create policy "Admins can update products"
  on products for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admins can delete products" on products;
create policy "Admins can delete products"
  on products for delete
  to authenticated
  using (true);

create or replace view public_products as
select
  id, slug, name, description, long_description, collection, category, tags,
  variants, size_guide, image, gallery, is_featured, is_new_arrival, price,
  authenticity_tag, created_at
from products
where published = true;

grant select on public_products to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

drop policy if exists "Authenticated can upload product images" on storage.objects;
create policy "Authenticated can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "Authenticated can delete product images" on storage.objects;
create policy "Authenticated can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');
