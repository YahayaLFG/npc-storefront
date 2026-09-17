'use server';

import { getProductById } from './products';

/**
 * Live variant options for the cart's edit panel — color, that color's
 * current sizes, its images, and which sizes are currently out of stock.
 * Called fresh every time the edit panel opens; nothing here is ever
 * read from what's cached in the cart itself, since the whole point is
 * validating against real current availability.
 *
 * Wraps the existing getProductById() rather than querying directly, so
 * there's exactly one source of truth for "what a product's variants
 * look like" — this file adds no new reads, just a client-callable
 * entry point to the existing one.
 */
export async function getVariantOptionsForProduct(productSlug) {
  const product = await getProductById(productSlug);
  if (!product) {
    return { found: false, variants: [] };
  }

  return {
    found: true,
    productName: product.name,
    variants: (product.variants || []).map((v) => ({
      color: v.color,
      sizes: v.sizes || [],
      images: v.images || [],
      outOfStockSizes: v.outOfStockSizes || [],
    })),
  };
}
