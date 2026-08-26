-- ============================================================
-- NPC — seed data (optional)
-- Carries over a starter catalog so the site isn't empty. Safe to skip.
-- ============================================================

insert into products (
  slug, supplier_title, supplier_url, supplier_price_cny, supplier_price_ngn,
  estimated_weight_kg, warehouse_shipping_cny, service_fee_cny,
  name, description, collection, category, tags, variants, size_guide,
  image, gallery, is_featured, is_new_arrival, published,
  price, landed_cost, expected_profit, profit_margin
) values
('boxed-tee', 'PLACEHOLDER — replace with real 1688 title', '', 45, null, 0.35, 0, 0,
 'Boxed Tee', 'A heavyweight tee, boxed through the body with a dropped shoulder.',
 'Men', 'Shirts', '{"New Arrivals"}',
 '[{"color":"Black","sizes":["S","M","L","XL"]}]',
 null,
 'https://picsum.photos/seed/npc-boxed-tee-1/1000/1250',
 '{"https://picsum.photos/seed/npc-boxed-tee-1/1000/1250"}',
 false, true, true, 18500, 13141, 5359, 0.290),

('flag-cutoff-shorts', 'Cross-Border European and American Trendy Brand Retro Flag Design Cuffed Denim Shorts for Women Y2K Style Straight Shorts Ins', '', null, 9540, 0.25, 0, 0,
 'Flag Cutoff Shorts', 'Cuffed denim shorts, stonewashed and worn in, with flag-print back pockets and pyramid stud detail.',
 'Women', 'Shorts', '{"New Arrivals"}',
 '[{"color":"Black","sizes":["S","M","L","XL","XXL"]},{"color":"Blue","sizes":["S","M","L","XL","XXL"]}]',
 '{"unit":"cm","fields":["Waist","Hip","Length"],"rows":[{"size":"S","values":[69,90,23]},{"size":"M","values":[73,94,23.5]},{"size":"L","values":[77,98,24]},{"size":"XL","values":[81,102,24.5]},{"size":"XXL","values":[85,106,25]}]}',
 '/products/flag-cutoff-shorts/main.jpg',
 '{"/products/flag-cutoff-shorts/main.jpg","/products/flag-cutoff-shorts/2.jpg","/products/flag-cutoff-shorts/3.jpg"}',
 true, true, true, 17900, 12595, 5306, 0.296)

on conflict (slug) do nothing;
