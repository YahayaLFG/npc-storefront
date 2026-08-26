import Link from 'next/link';
import { getAllOrdersAdmin } from '@/lib/admin/orders';
import { ORDER_STATUSES, orderStatusLabel } from '@/lib/orderStatus';
import { formatNGN } from '@/lib/format';

export default async function AdminOrdersPage({ searchParams }) {
  const status = searchParams?.status || '';
  const search = searchParams?.q || '';

  const orders = await getAllOrdersAdmin({ status, search });

  function filterHref(newStatus) {
    const params = new URLSearchParams();
    if (newStatus) params.set('status', newStatus);
    if (search) params.set('q', search);
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : '/admin/orders';
  }

  return (
    <div>
      <h1 className="font-display text-2xl">Orders</h1>

      <form action="/admin/orders" method="get" className="mt-6 flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="Search order number, product, customer…"
          className="w-full max-w-sm border border-line bg-panel px-4 py-2.5 text-sm text-bone placeholder:text-mute focus:border-bone"
        />
        <button type="submit" className="rounded-full border border-line px-5 py-2.5 text-xs text-bone">
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={filterHref('')}
          className={`rounded-full border px-3 py-1.5 text-xs ${
            !status ? 'border-bone bg-bone text-black' : 'border-line text-fog'
          }`}
        >
          All
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s.value}
            href={filterHref(s.value)}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              status === s.value ? 'border-bone bg-bone text-black' : 'border-line text-fog'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 text-fog">No orders match.</p>
      ) : (
        <div className="mt-8 divide-y divide-line border-t border-b border-line">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center gap-4 py-4"
            >
              <div className="h-16 w-14 shrink-0 overflow-hidden bg-panel">
                {order.product_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={order.product_image} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{order.product_name}</p>
                <p className="mt-0.5 font-mono text-xs text-fog">
                  {order.order_number || 'Unpaid'} · {order.profiles?.full_name || order.profiles?.email || '—'}
                </p>
              </div>
              <span className="hidden rounded-full border border-line px-3 py-1 text-xs text-fog sm:inline">
                {orderStatusLabel(order.status)}
              </span>
              <span className="font-mono text-sm">{formatNGN(order.product_price)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
