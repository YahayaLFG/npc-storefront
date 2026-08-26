import Link from 'next/link';
import { getFeatured, getNewArrivals, getByCollection } from '@/lib/products';
import ShelfSection from '@/components/ShelfSection';

export default async function HomePage() {
  const [featured, newArrivals, men, women, accessories] = await Promise.all([
    getFeatured(),
    getNewArrivals(),
    getByCollection('Men'),
    getByCollection('Women'),
    getByCollection('Accessories'),
  ]);

  const heroImage = featured[0]?.image || newArrivals[0]?.image;

  const shelves = [
    { title: 'Featured', products: featured, href: '/shop' },
    { title: 'New Arrivals', products: newArrivals, href: '/shop' },
    { title: 'Women', products: women, href: '/shop?collection=Women' },
    { title: 'Men', products: men, href: '/shop?collection=Men' },
    { title: 'Accessories', products: accessories, href: '/shop?collection=Accessories' },
  ];

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-10 md:px-8 md:pt-14">
        <div className="aspect-[4/3] w-full overflow-hidden bg-canvas-alt md:aspect-[16/9]">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-fog">
              Add your first product to set the hero image
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-6 border-b border-rule pb-10 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-fog">
              The algorithm found you first
            </p>
            <h1 className="mt-3 max-w-lg font-display text-3xl font-medium leading-tight tracking-tight text-ink md:text-5xl">
              Uniforms for the internet.
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/shop"
              className="flex items-center justify-center rounded-full bg-ink px-7 py-3 text-sm font-medium text-canvas transition-transform hover:scale-[1.02]"
            >
              Shop
            </Link>
            <Link
              href="/request"
              className="flex items-center justify-center rounded-full border border-ink px-7 py-3 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-canvas"
            >
              Request a Piece
            </Link>
          </div>
        </div>
      </section>

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
          <p className="mt-2 text-sm">Add your first one from the admin dashboard at /admin.</p>
        </div>
      )}

      <section className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-5 py-24 text-center md:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">Quiet flex only</p>
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
