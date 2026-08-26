import Link from 'next/link';
import { getMyOrders } from '@/lib/account/orders';
import { orderStatusLabel } from '@/lib/orderStatus';
import { formatNGN } from '@/lib/format';

export const metadata = { title: 'My Orders — NPC' };

export default async function MyOrdersPage() {
  const orders = await getMyOrders();

  return (
    <div className="mx-auto max-w-4xl px-5 py-14 md:px-8 md:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">Account</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="mt-14 text-center text-ink-fog">
          <p>No orders yet.</p>
          <Link href="/shop" className="mt-3 inline-block text-ink hover:underline">
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="mt-10 divide-y divide-rule border-t border-b border-rule">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.order_number || order.id}`}
              className="flex items-center gap-4 py-5"
            >
              <div className="h-20 w-16 shrink-0 overflow-hidden bg-canvas-alt">
                {order.product_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={order.product_image} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-ink">{order.product_name}</p>
                <p className="mt-1 text-xs text-ink-fog">
                  {order.variant_color} · {order.variant_size} · Qty {order.quantity}
                </p>
                <p className="mt-1 font-mono text-xs text-ink-fog">
                  {order.order_number || 'Awaiting payment'}
                </p>
              </div>
              <span className="hidden rounded-full border border-rule px-3 py-1 text-xs text-ink-fog sm:inline">
                {orderStatusLabel(order.status)}
              </span>
              <span className="font-mono text-sm text-ink">{formatNGN(order.product_price)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
