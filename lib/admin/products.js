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

/** A handful of recent products, for style/reference when writing new product copy. */
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

export async function getProductByIdAdmin(id) {
  const supabase = createClient();
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

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
    variants: formValues.variants || [],
    size_guide: formValues.sizeGuide || null,
    size_chart_image: formValues.sizeChartImage || null,
    image: formValues.image || null,
    gallery: formValues.gallery || [],
    is_featured: !!formValues.isFeatured,
    is_new_arrival: !!formValues.isNewArrival,
    authenticity_tag: formValues.authenticityTag || null,
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

  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/admin');
  revalidatePath(`/product/${slug}`);

  return data;
}

export async function deleteProductAdmin(id) {
  const supabase = createClient();
  const { data: existing } = await supabase.from('products').select('slug').eq('id', id).maybeSingle();

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/shop');
  revalidatePath('/admin');
  if (existing?.slug) revalidatePath(`/product/${existing.slug}`);
}

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
