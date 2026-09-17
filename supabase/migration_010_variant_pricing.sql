-- ============================================================
-- NPC — migration 010: variant-level pricing
-- Nullable — every existing variant keeps falling back to products.price
-- exactly as it does today. Nothing is overwritten.
-- ============================================================

alter table product_variants add column if not exists price numeric;
