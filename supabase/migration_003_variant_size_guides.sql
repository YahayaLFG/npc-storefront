-- ============================================================
-- NPC — migration 003: relational variants + size guides
-- Adds product_variants, size_guides, variant_size_guides.
-- Purely additive: does NOT touch products.variants, products.size_guide,
-- or products.size_chart_image. Those stay exactly as they are — nothing
-- reads from or writes to the new tables yet (that's Phase 3, a separate
-- application-layer change).
--
-- Run this in Supabase: SQL Editor → New query → paste → Run.
-- Safe to re-run (every statement uses IF NOT EXISTS / DROP ... IF EXISTS).
-- ============================================================

-- ------------------------------------------------------------
-- PRODUCT_VARIANTS
-- One row per color. Every variant belongs to exactly one product.
-- ------------------------------------------------------------
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,

  color text not null,
  sizes text[] not null default '{}',

  -- This variant's exact images. Empty by default — the app falls back
  -- to products.gallery when this is empty (enforced in Phase 3, the
  -- application layer; this table makes no assumption about that logic).
  images text[] not null default '{}',

  position int not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_variants_product_idx
  on product_variants (product_id, position);

-- Prevents two variants with the same color (case-insensitive) on one product.
create unique index if not exists product_variants_product_color_unique
  on product_variants (product_id, lower(color));

drop trigger if exists product_variants_set_updated_at on product_variants;
create trigger product_variants_set_updated_at
  before update on product_variants
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- SIZE_GUIDES
-- Scoped to one product (not a global/shared library — see the design
-- doc; this was a deliberate scope decision, easy to relax later by
-- making product_id nullable if you ever want cross-product templates).
-- ------------------------------------------------------------
create table if not exists size_guides (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,

  name text not null,          -- e.g. "Shirt", "Pants"
  unit text not null,          -- "cm" or "in" — same as today's size_guide.unit
  fields jsonb not null,       -- same shape as today's size_guide.fields
  rows jsonb not null,         -- same shape as today's size_guide.rows

  chart_image text,            -- original supplier chart for THIS guide

  position int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists size_guides_product_idx on size_guides (product_id);

-- Prevents two guides named "Shirt" (case-insensitive) on the same product.
create unique index if not exists size_guides_product_name_unique
  on size_guides (product_id, lower(name));

drop trigger if exists size_guides_set_updated_at on size_guides;
create trigger size_guides_set_updated_at
  before update on size_guides
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- VARIANT_SIZE_GUIDES
-- Many-to-many join. A variant can use more than one guide (e.g. a set
-- piece needing both a shirt chart and a pants chart); a guide is reused
-- across every variant it applies to instead of being duplicated.
-- ------------------------------------------------------------
create table if not exists variant_size_guides (
  variant_id uuid not null references product_variants(id) on delete cascade,

  -- RESTRICT, not cascade: deleting a size guide that's still linked to a
  -- variant should fail loudly, not silently unlink it from a product
  -- that's relying on it to show correct measurements to customers.
  size_guide_id uuid not null references size_guides(id) on delete restrict,

  position int not null default 0,

  primary key (variant_id, size_guide_id)
);

-- Fast "which variants use this guide" lookups (e.g. the admin UI showing
-- "this guide is used by 4 variants" before allowing a delete attempt).
create index if not exists variant_size_guides_guide_idx
  on variant_size_guides (size_guide_id);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Mirrors the existing simple model in schema.sql: anonymous visitors can
-- only see data belonging to published products; any authenticated user
-- has full access (this project has no admin-role system yet — every
-- authenticated user is treated as an admin, same as products/storage
-- policies already do).
-- ------------------------------------------------------------
alter table product_variants enable row level security;

drop policy if exists "Public can read variants of published products" on product_variants;
create policy "Public can read variants of published products"
  on product_variants for select
  to anon
  using (
    is_active = true
    and exists (
      select 1 from products p
      where p.id = product_variants.product_id and p.published = true
    )
  );

drop policy if exists "Authenticated can read all variants" on product_variants;
create policy "Authenticated can read all variants"
  on product_variants for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can insert variants" on product_variants;
create policy "Authenticated can insert variants"
  on product_variants for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update variants" on product_variants;
create policy "Authenticated can update variants"
  on product_variants for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete variants" on product_variants;
create policy "Authenticated can delete variants"
  on product_variants for delete
  to authenticated
  using (true);

alter table size_guides enable row level security;

drop policy if exists "Public can read size guides of published products" on size_guides;
create policy "Public can read size guides of published products"
  on size_guides for select
  to anon
  using (
    exists (
      select 1 from products p
      where p.id = size_guides.product_id and p.published = true
    )
  );

drop policy if exists "Authenticated can read all size guides" on size_guides;
create policy "Authenticated can read all size guides"
  on size_guides for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can insert size guides" on size_guides;
create policy "Authenticated can insert size guides"
  on size_guides for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update size guides" on size_guides;
create policy "Authenticated can update size guides"
  on size_guides for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete size guides" on size_guides;
create policy "Authenticated can delete size guides"
  on size_guides for delete
  to authenticated
  using (true);

alter table variant_size_guides enable row level security;

drop policy if exists "Public can read links for published products" on variant_size_guides;
create policy "Public can read links for published products"
  on variant_size_guides for select
  to anon
  using (
    exists (
      select 1 from product_variants pv
      join products p on p.id = pv.product_id
      where pv.id = variant_size_guides.variant_id
        and pv.is_active = true
        and p.published = true
    )
  );

drop policy if exists "Authenticated can read all links" on variant_size_guides;
create policy "Authenticated can read all links"
  on variant_size_guides for select
  to authenticated
  using (true);

drop policy if exists "Authenticated can insert links" on variant_size_guides;
create policy "Authenticated can insert links"
  on variant_size_guides for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update links" on variant_size_guides;
create policy "Authenticated can update links"
  on variant_size_guides for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated can delete links" on variant_size_guides;
create policy "Authenticated can delete links"
  on variant_size_guides for delete
  to authenticated
  using (true);
