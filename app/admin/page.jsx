import Link from 'next/link';
import { getAllProductsAdmin } from '@/lib/admin/products';
import { formatNGN } from '@/lib/format';
import DeleteProductButton from '@/components/admin/DeleteProductButton';

export default async function AdminDashboardPage() {
  const products = await getAllProductsAdmin();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-bone px-5 py-2.5 text-sm font-medium text-black"
        >
          + New Product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-10 text-fog">No products yet. Add your first one.</p>
      ) : (
        <div className="mt-8 divide-y divide-line border-t border-b border-line">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 py-4">
              <div className="h-16 w-14 shrink-0 overflow-hidden bg-panel">
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="h-full w-full object-cover" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="mt-0.5 font-mono text-xs text-fog">
                  {p.collection} · {p.category}
                </p>
              </div>

              <div className="hidden shrink-0 gap-2 md:flex">
                {p.is_new_arrival && (
                  <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wide text-fog">
                    New
                  </span>
                )}
                {p.is_featured && (
                  <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wide text-fog">
                    Featured
                  </span>
                )}
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                    p.published ? 'border-line text-bone' : 'border-line text-fog'
                  }`}
                >
                  {p.published ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="shrink-0 text-right font-mono text-sm">
                <p>{formatNGN(p.price)}</p>
                <p className="text-xs text-fog">profit {formatNGN(p.expected_profit)}</p>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <Link href={`/admin/products/${p.id}`} className="text-xs text-fog hover:text-bone">
                  Edit
                </Link>
                <DeleteProductButton id={p.id} name={p.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
