import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-display text-2xl">New Product</h1>
      <div className="mt-8">
        <ProductForm initial={null} />
      </div>
    </div>
  );
}
