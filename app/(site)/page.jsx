import Link from 'next/link';
import { getFeatured, getNewArrivals, getByCollection } from '@/lib/products';
import ShelfSection from '@/components/ShelfSection';
import NPCDropHero from '@/components/NPCDropHero';

export default async function HomePage() {
  const [featured, newArrivals, men, women, accessories] = await Promise.all([
    getFeatured(),
    getNewArrivals(),
    getByCollection('Men'),
    getByCollection('Women'),
    getByCollection('Accessories'),
  ]);

const heroProducts = [...featured, ...newArrivals, ...men, ...women, ...accessories].filter(
  (product, index, products) =>
    products.findIndex((p) => p.id === product.id) === index
);
  const shelves = [
    { title: 'Featured', products: featured, href: '/shop' },
    { title: 'New Arrivals', products: newArrivals, href: '/shop' },
    { title: 'Women', products: women, href: '/shop?collection=Women' },
    { title: 'Men', products: men, href: '/shop?collection=Men' },
    { title: 'Accessories', products: accessories, href: '/shop?collection=Accessories' },
  ];

  return (
    <>
      <NPCDropHero products={heroProducts} />

      {shelves.map((shelf, i) =>
        shelf.products.length ? (
          <ShelfSection
            key={shelf.title}
            index={i + 1}
            title={shelf.title}
            products={shelf.products}
            viewAllHref={shelf.href}
          />
        ) : null
      )}

      {!shelves.some((s) => s.products.length) && (
        <div className="mx-auto max-w-2xl px-5 py-24 text-center text-ink-fog">
          <p>No products published yet.</p>
          <p className="mt-2 text-sm">
            Add your first one from the admin dashboard at /admin.
          </p>
        </div>
      )}

      <section className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-5 py-24 text-center md:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">
            Quiet flex only
          </p>
          <h2 className="mx-auto mt-4 max-w-lg font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
            Seen something we don't carry?
          </h2>
          <Link
            href="/request"
            className="mt-8 inline-flex items-center rounded-full bg-ink px-8 py-3.5 text-sm font-medium text-canvas transition-transform hover:scale-[1.02]"
          >
            Send it through
          </Link>
        </div>
      </section>
    </>
  );
}
