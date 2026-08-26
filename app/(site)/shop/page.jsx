import Link from 'next/link';
import { getProducts } from '@/lib/products';
import { COLLECTIONS, CATEGORIES } from '@/lib/taxonomy';
import ProductCard from '@/components/ProductCard';

export const metadata = { title: 'Shop — NPC' };

export default async function ShopPage({ searchParams }) {
  const activeCollection = searchParams?.collection || null;
  const activeCategory = searchParams?.category || null;

  const all = await getProducts();

  const products = all.filter((p) => {
    if (activeCollection && p.collection !== activeCollection) return false;
    if (activeCategory && p.category !== activeCategory) return false;
    return true;
  });

  function filterHref(collection, category) {
    const params = new URLSearchParams();
    if (collection) params.set('collection', collection);
    if (category) params.set('category', category);
    const qs = params.toString();
    return qs ? `/shop?${qs}` : '/shop';
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">Full catalog</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">Shop</h1>

      <div className="mt-10 flex flex-wrap gap-2 border-b border-rule pb-8">
        <Link
          href="/shop"
          className={`rounded-full border px-4 py-1.5 text-xs tracking-wide transition-colors ${
            !activeCollection
              ? 'border-ink bg-ink text-canvas'
              : 'border-rule text-ink-fog hover:border-ink hover:text-ink'
          }`}
        >
          All
        </Link>
        {COLLECTIONS.map((c) => (
          <Link
            key={c}
            href={filterHref(c, activeCollection === c ? null : activeCategory)}
            className={`rounded-full border px-4 py-1.5 text-xs tracking-wide transition-colors ${
              activeCollection === c
                ? 'border-ink bg-ink text-canvas'
                : 'border-rule text-ink-fog hover:border-ink hover:text-ink'
            }`}
          >
            {c}
          </Link>
        ))}
        <span className="mx-1 self-center text-ink-fog">·</span>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={filterHref(activeCollection, activeCategory === c ? null : c)}
            className={`rounded-full border px-4 py-1.5 text-xs tracking-wide transition-colors ${
              activeCategory === c
                ? 'border-ink bg-ink text-canvas'
                : 'border-rule text-ink-fog hover:border-ink hover:text-ink'
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="py-20 text-center text-ink-fog">
          <p>Nothing here right now.</p>
          <Link href="/shop" className="mt-3 inline-block text-ink hover:underline">
            View everything
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-14 md:gap-x-10 md:gap-y-20">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
