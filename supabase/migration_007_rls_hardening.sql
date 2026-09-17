-- ============================================================
-- NPC — migration 007: RLS + Storage security hardening
-- Replaces every "any authenticated user" write policy on products,
-- product_variants, size_guides, variant_size_guides, and the
-- product-images storage bucket with admin-only equivalents.
-- Read access for everyone else (anon browsing, logged-in customers
-- shopping) is preserved exactly as it functions today — no customer
-- visibility changes, only customer WRITE access is removed.
-- Approved by the user after inspecting the complete existing policy
-- list and verifying is_admin() is safe to call from RLS (see chat).
-- ============================================================

-- PRODUCTS
drop policy if exists "Admins can read all products" on products;
create policy "Read products"
  on products for select to authenticated
  using (is_admin() or published = true);

drop policy if exists "Admins can insert products" on products;
create policy "Admins can insert products"
  on products for insert to authenticated with check (is_admin());

drop policy if exists "Admins can update products" on products;
create policy "Admins can update products"
  on products for update to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Admins can delete products" on products;
create policy "Admins can delete products"
  on products for delete to authenticated using (is_admin());

-- PRODUCT_VARIANTS
drop policy if exists "Public can read variants of published products" on product_variants;
drop policy if exists "Authenticated can read all variants" on product_variants;
create policy "Read variants"
  on product_variants for select to authenticated
  using (
    is_admin()
    or (is_active = true and exists (
      select 1 from products p where p.id = product_variants.product_id and p.published = true
    ))
  );
create policy "Public can read variants of published products"
  on product_variants for select to anon
  using (
    is_active = true and exists (
      select 1 from products p where p.id = product_variants.product_id and p.published = true
    )
  );

drop policy if exists "Authenticated can insert variants" on product_variants;
create policy "Admins can insert variants"
  on product_variants for insert to authenticated with check (is_admin());

drop policy if exists "Authenticated can update variants" on product_variants;
create policy "Admins can update variants"
  on product_variants for update to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Authenticated can delete variants" on product_variants;
create policy "Admins can delete variants"
  on product_variants for delete to authenticated using (is_admin());

-- SIZE_GUIDES
drop policy if exists "Public can read size guides of published products" on size_guides;
drop policy if exists "Authenticated can read all size guides" on size_guides;
create policy "Read size guides"
  on size_guides for select to authenticated
  using (
    is_admin()
    or exists (select 1 from products p where p.id = size_guides.product_id and p.published = true)
  );
create policy "Public can read size guides of published products"
  on size_guides for select to anon
  using (exists (select 1 from products p where p.id = size_guides.product_id and p.published = true));

drop policy if exists "Authenticated can insert size guides" on size_guides;
create policy "Admins can insert size guides"
  on size_guides for insert to authenticated with check (is_admin());

drop policy if exists "Authenticated can update size guides" on size_guides;
create policy "Admins can update size guides"
  on size_guides for update to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Authenticated can delete size guides" on size_guides;
create policy "Admins can delete size guides"
  on size_guides for delete to authenticated using (is_admin());

-- VARIANT_SIZE_GUIDES
drop policy if exists "Public can read links for published products" on variant_size_guides;
drop policy if exists "Authenticated can read all links" on variant_size_guides;
create policy "Read variant size guide links"
  on variant_size_guides for select to authenticated
  using (
    is_admin()
    or exists (
      select 1 from product_variants pv join products p on p.id = pv.product_id
      where pv.id = variant_size_guides.variant_id and pv.is_active = true and p.published = true
    )
  );
create policy "Public can read links for published products"
  on variant_size_guides for select to anon
  using (
    exists (
      select 1 from product_variants pv join products p on p.id = pv.product_id
      where pv.id = variant_size_guides.variant_id and pv.is_active = true and p.published = true
    )
  );

drop policy if exists "Authenticated can insert links" on variant_size_guides;
create policy "Admins can insert variant size guide links"
  on variant_size_guides for insert to authenticated with check (is_admin());

drop policy if exists "Authenticated can update links" on variant_size_guides;
create policy "Admins can update variant size guide links"
  on variant_size_guides for update to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "Authenticated can delete links" on variant_size_guides;
create policy "Admins can delete variant size guide links"
  on variant_size_guides for delete to authenticated using (is_admin());

-- STORAGE: product-images bucket
-- "Public can view product images" (SELECT, to public) is untouched —
-- left exactly as it already works, not reproduced/re-created here.

drop policy if exists "Authenticated can upload product images" on storage.objects;
create policy "Admins can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and is_admin());

drop policy if exists "Authenticated can delete product images" on storage.objects;
create policy "Admins can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and is_admin());

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());
