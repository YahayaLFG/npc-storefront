-- ============================================================
-- NPC — migration 002: variants + standardized size guide
-- Only needed if your database predates variants (sizes/colors were flat
-- columns). If installing fresh from schema.sql, skip this file — variants
-- are already included there.
-- ============================================================

alter table products add column if not exists variants jsonb not null default '[]';
alter table products add column if not exists size_chart_image text;

update products
set variants = (
  select coalesce(
    jsonb_agg(jsonb_build_object('color', c, 'sizes', to_jsonb(products.sizes))),
    '[]'::jsonb
  )
  from unnest(products.colors) as c
)
where variants = '[]'::jsonb
  and colors is not null
  and array_length(colors, 1) > 0;

alter table products drop column if exists sizes;
alter table products drop column if exists colors;

create or replace view public_products as
select
  id, slug, name, description, long_description, collection, category, tags,
  variants, size_guide, image, gallery, is_featured, is_new_arrival, price,
  authenticity_tag, created_at
from products
where published = true;

grant select on public_products to anon, authenticated;
