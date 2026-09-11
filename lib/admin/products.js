'use server';

import { createClient } from '../supabase/server';
import { calculateNPCPrice } from '../pricing';
import { revalidatePath } from 'next/cache';

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Recent published product names + descriptions, used as style examples for the importer. */
export async function getRecentProductsForStyle(limit = 8) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('name, description, category, collection')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data;
}

export async function getAllProductsAdmin() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * A single product by its database id, including internal fields, PLUS
 * its relational variants and size guides — for the edit form.
 * Attached under `variants_relational` / `size_guides_relational` rather
 * than overwriting `variants`/`size_guide` (the legacy JSONB columns are
 * returned untouched too, in case anything ever needs to fall back to them).
 */
export async function getProductByIdAdmin(id) {
  const supabase = createClient();
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const { data: variantRows, error: variantError } = await supabase
    .from('product_variants')
    .select('id, color, sizes, images, position, is_active, out_of_stock_sizes')
    .eq('product_id', id)
    .order('position', { ascending: true });

  if (variantError) throw new Error(variantError.message);

  const { data: guideRows, error: guideError } = await supabase
    .from('size_guides')
    .select('id, name, unit, fields, rows, chart_image, position')
    .eq('product_id', id)
    .order('position', { ascending: true });

  if (guideError) throw new Error(guideError.message);

  const variantIds = (variantRows || []).map((v) => v.id);
  let linkRows = [];
  if (variantIds.length) {
    const { data: links, error: linkError } = await supabase
      .from('variant_size_guides')
      .select('variant_id, size_guide_id')
      .in('variant_id', variantIds);
    if (linkError) throw new Error(linkError.message);
    linkRows = links || [];
  }

  const guideIdsByVariant = {};
  for (const link of linkRows) {
    (guideIdsByVariant[link.variant_id] ??= []).push(link.size_guide_id);
  }

  return {
    ...data,
    variants_relational: (variantRows || []).map((v) => ({
      ...v,
      size_guide_ids: guideIdsByVariant[v.id] || [],
    })),
    size_guides_relational: guideRows || [],
  };
}

/**
 * Rebuilds a product's variants, size guides, and the links between them
 * to exactly match what was submitted. Order of operations matters here —
 * see the inline comments — specifically so that removing a size guide
 * never trips the RESTRICT foreign key on variant_size_guides.size_guide_id.
 *
 * `variants` / `sizeGuides` items may each have either a real `id`
 * (existing row, gets updated) or a `clientId` only (new row, gets
 * inserted) — `sizeGuideClientIds` on a variant references OTHER items in
 * the same `sizeGuides` array by their `id` (if existing) or `clientId`
 * (if new), which is why guides are upserted before variant links are
 * rebuilt, so every reference can be resolved to a real database id.
 */
async function syncVariantsAndSizeGuides(supabase, productId, { variants = [], sizeGuides = [] }) {
  const { data: existingVariants } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId);
  const { data: existingGuides } = await supabase
    .from('size_guides')
    .select('id')
    .eq('product_id', productId);

  // 1. Wipe all existing links for this product's variants first. They're
  //    fully rebuilt at the end regardless, and clearing them now means
  //    deleting a removed size guide below can never hit the RESTRICT FK.
  const existingVariantIds = (existingVariants || []).map((v) => v.id);
  if (existingVariantIds.length) {
    const { error } = await supabase
      .from('variant_size_guides')
      .delete()
      .in('variant_id', existingVariantIds);
    if (error) throw new Error(error.message);
  }

  // 2. Delete size guides that were removed in the form.
  const keptGuideIds = new Set(sizeGuides.filter((g) => g.id).map((g) => g.id));
  const guidesToDelete = (existingGuides || []).map((g) => g.id).filter((id) => !keptGuideIds.has(id));
  if (guidesToDelete.length) {
    const { error } = await supabase.from('size_guides').delete().in('id', guidesToDelete);
    if (error) throw new Error(error.message);
  }

  // 3. Upsert size guides, building clientId/id -> real id map.
  const guideIdByKey = {};
  for (let i = 0; i < sizeGuides.length; i++) {
    const g = sizeGuides[i];
    const row = {
      product_id: productId,
      name: g.name,
      unit: g.unit,
      fields: g.fields,
      rows: g.rows,
      chart_image: g.chartImage || null,
      position: i,
    };
    if (g.id) {
      const { error } = await supabase.from('size_guides').update(row).eq('id', g.id);
      if (error) throw new Error(error.message);
      guideIdByKey[g.id] = g.id;
    } else {
      const { data: inserted, error } = await supabase.from('size_guides').insert(row).select().maybeSingle();
      if (error) throw new Error(error.message);
      guideIdByKey[g.clientId] = inserted.id;
    }
  }

  // 4. Delete variants that were removed in the form (cascades any
  //    leftover links automatically, though step 1 already cleared them).
  const keptVariantIds = new Set(variants.filter((v) => v.id).map((v) => v.id));
  const variantsToDelete = (existingVariants || []).map((v) => v.id).filter((id) => !keptVariantIds.has(id));
  if (variantsToDelete.length) {
    const { error } = await supabase.from('product_variants').delete().in('id', variantsToDelete);
    if (error) throw new Error(error.message);
  }

  // 5. Upsert variants, building clientId/id -> real id map.
  const variantIdByKey = {};
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const row = {
      product_id: productId,
      color: v.color,
      sizes: v.sizes,
      images: v.images || [],
      out_of_stock_sizes: v.outOfStockSizes || [],
      position: i,
      is_active: v.isActive !== false,
    };
    if (v.id) {
      const { error } = await supabase.from('product_variants').update(row).eq('id', v.id);
      if (error) throw new Error(error.message);
      variantIdByKey[v.id] = v.id;
    } else {
      const { data: inserted, error } = await supabase.from('product_variants').insert(row).select().maybeSingle();
      if (error) throw new Error(error.message);
      variantIdByKey[v.clientId] = inserted.id;
    }
  }

  // 6. Rebuild links fresh from the resolved ids.
  const linkRows = [];
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const realVariantId = v.id ? variantIdByKey[v.id] : variantIdByKey[v.clientId];
    const guideKeys = v.sizeGuideClientIds || [];
    guideKeys.forEach((key, position) => {
      const realGuideId = guideIdByKey[key];
      if (realVariantId && realGuideId) {
        linkRows.push({ variant_id: realVariantId, size_guide_id: realGuideId, position });
      }
    });
  }
  if (linkRows.length) {
    const { error } = await supabase.from('variant_size_guides').insert(linkRows);
    if (error) throw new Error(error.message);
  }
}

/**
 * Creates or updates a product. Always recomputes price/landedCost/profit
 * server-side from the submitted cost inputs — the browser never gets to
 * set the final price directly, only the raw sourcing numbers.
 *
 * Variants and size guides are written to the relational tables (the
 * source of truth for reads — see lib/products.js). The legacy
 * products.variants / products.size_guide / products.size_chart_image
 * JSONB columns are ALSO kept in sync on every save, purely as a
 * safety net — nothing currently reads them, and they are not required
 * for the app to function, but they're cheap to keep current and this
 * project was explicitly asked not to remove them yet.
 */
export async function saveProduct(formValues) {
  const supabase = createClient();

  const pricing = calculateNPCPrice({
    supplierPriceCny: formValues.supplierPriceCny || 0,
    supplierPriceNgn:
      formValues.supplierPriceNgn !== undefined && formValues.supplierPriceNgn !== ''
        ? Number(formValues.supplierPriceNgn)
        : null,
    estimatedWeightKg: Number(formValues.estimatedWeightKg) || 0,
    warehouseShippingCny: Number(formValues.warehouseShippingCny) || 0,
    serviceFeeCny: Number(formValues.serviceFeeCny) || 0,
  });

  const slug = formValues.slug?.trim() || slugify(formValues.name);

  const legacyVariantsJson = (formValues.variants || []).map((v) => ({
    color: v.color,
    sizes: v.sizes,
  }));
  const sortedGuides = [...(formValues.sizeGuides || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const legacyPrimaryGuide = sortedGuides[0] || null;
  const legacySizeGuideJson = legacyPrimaryGuide
    ? { unit: legacyPrimaryGuide.unit, fields: legacyPrimaryGuide.fields, rows: legacyPrimaryGuide.rows }
    : null;
  const legacyChartImage = legacyPrimaryGuide?.chartImage || null;

  const row = {
    slug,
    supplier_title: formValues.supplierTitle || '',
    supplier_url: formValues.supplierUrl || '',
    supplier_price_cny: formValues.supplierPriceCny || null,
    supplier_price_ngn:
      formValues.supplierPriceNgn !== undefined && formValues.supplierPriceNgn !== ''
        ? Number(formValues.supplierPriceNgn)
        : null,
    estimated_weight_kg: Number(formValues.estimatedWeightKg) || 0,
    warehouse_shipping_cny: Number(formValues.warehouseShippingCny) || 0,
    service_fee_cny: Number(formValues.serviceFeeCny) || 0,
    name: formValues.name,
    description: formValues.description || '',
    long_description: formValues.longDescription || '',
    collection: formValues.collection,
    category: formValues.category,
    tags: formValues.tags || [],
    variants: legacyVariantsJson,
    size_guide: legacySizeGuideJson,
    size_chart_image: legacyChartImage,
    image: formValues.image || null,
    gallery: formValues.gallery || [],
    is_featured: !!formValues.isFeatured,
    is_new_arrival: !!formValues.isNewArrival,
    published: formValues.published !== false,
    price: pricing.npcSellingPrice,
    landed_cost: pricing.landedCost,
    expected_profit: pricing.expectedProfit,
    profit_margin: pricing.profitMargin,
  };

  const query = formValues.id
    ? supabase.from('products').update(row).eq('id', formValues.id).select().maybeSingle()
    : supabase.from('products').insert(row).select().maybeSingle();

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  await syncVariantsAndSizeGuides(supabase, data.id, {
    variants: formValues.variants || [],
    sizeGuides: formValues.sizeGuides || [],
  });

  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/admin');
  revalidatePath(`/product/${slug}`);

  return data;
}

export async function deleteProductAdmin(id) {
  const supabase = createClient();
  const { data: existing } = await supabase.from('products').select('slug').eq('id', id).maybeSingle();

  // product_variants and size_guides both cascade on products.id delete,
  // and variant_size_guides cascades on product_variants.id delete — no
  // manual cleanup needed here.
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/admin');
  if (existing?.slug) revalidatePath(`/product/${existing.slug}`);
}

/**
 * Live pricing preview for the admin form — same engine, but a plain call
 * (not a save) so the dashboard can show landed cost / price / profit as
 * the merchandiser types, before they hit Publish.
 */
export async function previewPricing(input) {
  return calculateNPCPrice({
    supplierPriceCny: Number(input.supplierPriceCny) || 0,
    supplierPriceNgn:
      input.supplierPriceNgn !== undefined && input.supplierPriceNgn !== ''
        ? Number(input.supplierPriceNgn)
        : null,
    estimatedWeightKg: Number(input.estimatedWeightKg) || 0,
    warehouseShippingCny: Number(input.warehouseShippingCny) || 0,
    serviceFeeCny: Number(input.serviceFeeCny) || 0,
  });
}
