import { createClient } from './supabase/server';

function mapRow(row) {
  return {
    id: row.slug,
    name: row.name,
    category: row.category,
    collection: row.collection,
    tags: row.tags ?? [],
    image: row.image,
    gallery: row.gallery ?? [],
    variants: row.variants ?? [],
    description: row.description,
    longDescription: row.long_description,
    sizeGuide: row.size_guide ?? null,
    price: row.price,
    isFeatured: row.is_featured,
    isNewArrival: row.is_new_arrival,
    authenticityTag: row.authenticity_tag ?? null,
  };
}

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
  return data.map(mapRow);
}

export async function getProductById(slug) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('public_products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('getProductById error:', error.message);
    return null;
  }
  return data ? mapRow(data) : null;
}

export async function getNewArrivals() {
  const products = await getProducts();
  return products.filter((p) => p.isNewArrival);
}

export async function getFeatured() {
  const products = await getProducts();
  return products.filter((p) => p.isFeatured);
}

export async function getByCollection(collection) {
  const products = await getProducts();
  return products.filter((p) => p.collection === collection);
}

export async function getByCategory(category) {
  const products = await getProducts();
  return products.filter((p) => p.category === category);
}

export async function searchProducts(query) {
  if (!query?.trim()) return [];
  const q = query.trim().toLowerCase();
  const products = await getProducts();

  return products.filter((p) => {
    const colorNames = (p.variants ?? []).map((v) => v.color);
    const haystack = [
      p.name,
      p.description,
      p.longDescription,
      p.category,
      p.collection,
      ...colorNames,
      ...(p.tags ?? []),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
