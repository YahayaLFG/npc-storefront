-- ============================================================
-- NPC — migration 008: out_of_stock_sizes documentation
-- `product_variants.out_of_stock_sizes` is already live in production
-- (confirmed: used by lib/products.js, lib/admin/products.js,
-- lib/account/checkout.js, and components/admin/ProductForm.jsx) but no
-- migration file in this repository ever created it — likely added
-- directly via the Supabase dashboard at some point. This migration
-- exists purely so the migrations folder tells the truth about the
-- real schema going forward.
--
-- `if not exists` makes this a true no-op against a database where the
-- column already exists — it does NOT alter, reset, or touch the
-- existing column or any of its data.
-- ============================================================

alter table product_variants
  add column if not exists out_of_stock_sizes text[] not null default '{}';
