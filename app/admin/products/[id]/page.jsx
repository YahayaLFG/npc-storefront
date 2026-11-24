import { notFound } from 'next/navigation';
import { getProductByIdAdmin } from '@/lib/admin/products';
import ProductForm from '@/components/admin/ProductForm';

export default async function EditProductPage({ params }) {
  const { id } = await params;
  const product = await getProductByIdAdmin(id);
  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl">Edit — {product.name}</h1>
      <div className="mt-8">
        <ProductForm initial={product} />
      </div>
    </div>
  );
}
