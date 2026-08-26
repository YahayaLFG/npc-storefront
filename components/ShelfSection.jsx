import Link from 'next/link';
import ProductCard from './ProductCard';

export default function ShelfSection({ index, title, products, viewAllHref }) {
  if (!products?.length) return null;

  return (
    <section className="border-t border-rule py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-xs text-ink-fog">N°{String(index).padStart(2, '0')}</span>
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink md:text-3xl">{title}</h2>
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="hidden shrink-0 text-sm text-ink-fog hover:text-ink md:block"
            >
              View all
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-14 md:gap-x-10 md:gap-y-20">
          {products.slice(0, 4).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>

        {viewAllHref && (
          <Link href={viewAllHref} className="mt-8 block text-sm text-ink-fog hover:text-ink md:hidden">
            View all
          </Link>
        )}
      </div>
    </section>
  );
}
