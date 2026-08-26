import Image from 'next/image';
import Link from 'next/link';
import { formatNGN } from '@/lib/format';

export default function ProductCard({ product, index = 0 }) {
  return (
    <Link href={`/product/${product.id}`} className="group flex flex-col text-ink">
      <div className="reticle relative aspect-[4/5] w-full overflow-hidden bg-canvas-alt">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {(product.isNewArrival || product.isFeatured) && (
          <span className="absolute left-3 top-3 bg-canvas/90 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-ink">
            {product.isNewArrival ? 'New' : 'Featured'}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-fog">
          {product.category}
          {product.authenticityTag && ` · ${product.authenticityTag}`}
        </span>
        <h3 className="font-display text-base text-ink">{product.name}</h3>
        <span className="font-mono text-sm text-ink-fog">{formatNGN(product.price)}</span>
      </div>
    </Link>
  );
}
