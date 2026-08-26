import Link from 'next/link';
import { getProductById } from '@/lib/products';
import ProductDetailClient from '@/components/ProductDetailClient';

export async function generateMetadata({ params }) {
  const product = await getProductById(params.id);
  return { title: product ? `${product.name} — NPC` : 'NPC' };
}

export default async function ProductPage({ params }) {
  const product = await getProductById(params.id);

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-fog">Not found</p>
        <h1 className="mt-3 font-display text-3xl text-ink">This piece doesn't exist. Yet.</h1>
        <p className="mt-3 text-ink-fog">It may have sold out or been removed.</p>
        <Link href="/shop" className="mt-6 inline-block text-ink hover:underline">
          Back to shop
        </Link>
      </div>
    );
  }

  return <ProductDetailClient product={product} />;
}
