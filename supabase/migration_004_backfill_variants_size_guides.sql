-- ============================================================
-- NPC — migration 004: backfill variants + size guides
-- Converts existing products.variants / products.size_guide JSONB into
-- the new relational tables created in migration_003. Read-only against
-- `products` — inserts only, into the new tables. products.variants,
-- products.size_guide, and products.size_chart_image are NOT modified
-- or dropped by this migration.
--
-- Idempotent: a product is skipped entirely if it already has any
-- product_variants rows (so re-running this after a partial run, or
-- after Phase 3 has started writing new variants, won't create
-- duplicates). Run the verification queries at the bottom after.
-- ============================================================

do $$
declare
  prod record;
  variant_elem jsonb;
  new_guide_id uuid;
  idx int;
  guide_name text;
begin
  for prod in
    select p.id, p.category, p.variants, p.size_guide, p.size_chart_image
    from products p
    where p.variants is not null
      and jsonb_typeof(p.variants) = 'array'
      and jsonb_array_length(p.variants) > 0
      and not exists (
        select 1 from product_variants pv where pv.product_id = p.id
      )
  loop
    idx := 0;

    for variant_elem in
      select * from jsonb_array_elements(prod.variants)
    loop
      insert into product_variants (product_id, color, sizes, images, position, is_active)
      values (
        prod.id,
        variant_elem->>'color',
        coalesce(
          (select array_agg(x) from jsonb_array_elements_text(coalesce(variant_elem->'sizes', '[]'::jsonb)) as x),
          '{}'::text[]
        ),
        '{}'::text[],
        idx,
        true
      );
      idx := idx + 1;
    end loop;

    if prod.size_guide is not null then
      guide_name := coalesce(nullif(trim(prod.category), ''), 'Default');

      insert into size_guides (product_id, name, unit, fields, rows, chart_image, position)
      values (
        prod.id,
        guide_name,
        coalesce(prod.size_guide->>'unit', 'cm'),
        coalesce(prod.size_guide->'fields', '[]'::jsonb),
        coalesce(prod.size_guide->'rows', '[]'::jsonb),
        prod.size_chart_image,
        0
      )
      returning id into new_guide_id;

      insert into variant_size_guides (variant_id, size_guide_id, position)
      select pv.id, new_guide_id, 0
      from product_variants pv
      where pv.product_id = prod.id;
    end if;
  end loop;
end $$;

-- ============================================================
-- VERIFICATION — run these after and compare the two sides of each pair.
-- All read-only, safe to run any time.
-- ============================================================

-- A) Total variants migrated should equal the total variants that existed
--    in the JSONB across all products.
select
  (select coalesce(sum(jsonb_array_length(variants)), 0) from products where variants is not null) as jsonb_variant_count,
  (select count(*) from product_variants) as relational_variant_count;

-- B) Total size guides migrated should equal the number of products that
--    had a non-null size_guide.
select
  (select count(*) from products where size_guide is not null) as jsonb_size_guide_count,
  (select count(*) from size_guides) as relational_size_guide_count;

-- C) Spot-check: every migrated variant's color/sizes side-by-side with
--    its source product, for manual eyeballing.
select
  p.slug,
  p.name as product_name,
  pv.color,
  pv.sizes,
  pv.position
from product_variants pv
join products p on p.id = pv.product_id
order by p.slug, pv.position;

-- D) Every product that had a size_guide should now have exactly one
--    size_guides row, linked to ALL of that product's migrated variants.
select
  p.slug,
  sg.name as guide_name,
  count(vsg.variant_id) as linked_variant_count,
  (select count(*) from product_variants pv2 where pv2.product_id = p.id) as total_variants_for_product
from products p
join size_guides sg on sg.product_id = p.id
left join variant_size_guides vsg on vsg.size_guide_id = sg.id
where p.size_guide is not null
group by p.slug, sg.name, p.id
order by p.slug;
-- linked_variant_count should equal total_variants_for_product on every row.
