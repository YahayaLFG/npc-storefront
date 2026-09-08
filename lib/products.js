import { createClient } from './supabase/server';

/**
 * STOREFRONT DATA LAYER
 * ----------------------
 * Every function here queries `public_products` — a Postgres VIEW (see
 * supabase/schema.sql) that physically does not contain supplier_title,
 * supplier_url, supplier_price_*, landed_cost, expected_profit, or
 * profit_margin. That split is enforced by the database itself.
 *
 * Variants and size guides now come from the relational tables
 * (product_variants, size_guides, variant_size_guides — see
 * supabase/migration_003_variant_size_guides.sql), NOT from the legacy
 * products.variants / products.size_guide JSONB columns. Those columns
 * still exist and are still kept in sync on save (see
 * lib/admin/products.js) as a safety net, but nothing here reads them
 * anymore — the relational tables are the source of truth for reads.
 *
 * Admin-only reads/writes (the dashboard) live in lib/admin/products.js and
 * query the real `products` table using an authenticated session.
 */

function mapRow(row, extra = {}) {
  return {
    id: row.slug,
    name: row.name,
    category: row.category,
    collection: row.collection,
    tags: row.tags ?? [],
    image: row.image,
    gallery: row.gallery ?? [],
    description: row.description,
    longDescription: row.long_description,
    price: row.price,
    isFeatured: row.is_featured,
    isNewArrival: row.is_new_arrival,
    // Color names only — cheap, used for search/filtering on list views.
    colors: extra.colors ?? [],
    // Full variant objects (color, sizes, images, linked size guides).
    // Only populated by getProductById — list views (getProducts) leave
    // this empty since ProductCard never reads per-variant detail, and
    // fetching full variant+guide joins for every product on a grid page
    // would be wasted work.
    variants: extra.variants ?? [],
  };
}

/**
 * Attaches lightweight color-name lists to a batch of products, in one
 * extra query — used by list views (shop grid, search) that need to know
 * a product's colors but never show per-variant images or size guides.
 */
async function attachColors(supabase, rows) {
  const productIds = rows.map((r) => r.id);
  if (!productIds.length) return {};

  const { data, error } = await supabase
    .from('product_variants')
    .select('product_id, color')
    .in('product_id', productIds)
    .eq('is_active', true);

  if (error) {
    console.error('attachColors error:', error.message);
    return {};
  }

  const colorsByProduct = {};
  for (const v of data) {
    (colorsByProduct[v.product_id] ??= []).push(v.color);
  }
  return colorsByProduct;
}

/** Returns every published product (lightweight — colors only, no per-variant images/size guides). */
export async function getProducts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('public_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getProducts error:', error.message);
    return [];
  }

  const colorsByProduct = await attachColors(supabase, data);
  return data.map((row) => mapRow(row, { colors: colorsByProduct[row.id] || [] }));
}

/**
 * Returns a single published product by its slug, with full variant detail:
 * each variant's own images (falls back to the product gallery in the UI
 * when empty — see ProductDetailClient) and the size guide(s) linked to
 * that specific variant only.
 */
export async function getProductById(slug) {
  const supabase = createClient();
  const { data: row, error } = await supabase
    .from('public_products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('getProductById error:', error.message);
    return null;
  }
  if (!row) return null;

  const { data: variantRows, error: variantError } = await supabase
    .from('product_variants')
    .select('id, color, sizes, images, position')
    .eq('product_id', row.id)
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (variantError) {
    console.error('getProductById variants error:', variantError.message);
  }

  const variantIds = (variantRows || []).map((v) => v.id);

  let linkRows = [];
  if (variantIds.length) {
    const { data, error: linkError } = await supabase
      .from('variant_size_guides')
      .select('variant_id, position, size_guides(id, name, unit, fields, rows)')
      .in('variant_id', variantIds)
      .order('position', { ascending: true });

    if (linkError) {
      console.error('getProductById size guide links error:', linkError.message);
    } else {
      linkRows = data || [];
    }
  }

  const guidesByVariant = {};
  for (const link of linkRows) {
    if (!link.size_guides) continue;
    (guidesByVariant[link.variant_id] ??= []).push({
      id: link.size_guides.id,
      name: link.size_guides.name,
      unit: link.size_guides.unit,
      fields: link.size_guides.fields,
      rows: link.size_guides.rows,
    });
  }

  const variants = (variantRows || []).map((v) => ({
    id: v.id,
    color: v.color,
    sizes: v.sizes ?? [],
    images: v.images ?? [],
    sizeGuides: guidesByVariant[v.id] || [],
  }));

  return mapRow(row, { variants, colors: variants.map((v) => v.color) });
}

/** Products flagged as "new arrival" in the admin dashboard. */
export async function getNewArrivals() {
  const products = await getProducts();
  return products.filter((p) => p.isNewArrival);
}

/** Products flagged as "featured" in the admin dashboard. */
export async function getFeatured() {
  const products = await getProducts();
  return products.filter((p) => p.isFeatured);
}

/** Products under a given collection (Men / Women / Accessories). */
export async function getByCollection(collection) {
  const products = await getProducts();
  return products.filter((p) => p.collection === collection);
}

/** Products under a given category (Denim, Jackets, Shoes, etc.). */
export async function getByCategory(category) {
  const products = await getProducts();
  return products.filter((p) => p.category === category);
}

/**
 * Searches products by name, description, category, collection, colors,
 * and tags — case-insensitive substring match across all of them.
 */
export async function searchProducts(query) {
  if (!query?.trim()) return [];
  const q = query.trim().toLowerCase();
  const products = await getProducts();

  return products.filter((p) => {
    const haystack = [p.name, p.description, p.longDescription, p.category, p.collection, ...p.colors, ...(p.tags ?? [])]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
