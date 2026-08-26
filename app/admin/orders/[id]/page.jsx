import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderDetailAdmin } from '@/lib/admin/orders';
import { formatNGN } from '@/lib/format';
import OrderStatusControl from '@/components/admin/OrderStatusControl';
import WarehouseForm from '@/components/admin/WarehouseForm';

export default async function AdminOrderDetailPage({ params }) {
  const order = await getOrderDetailAdmin(params.id);
  if (!order) notFound();

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-fog hover:text-bone">
        ← All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-mute">{order.order_number || 'Unpaid — no order number yet'}</p>
          <h1 className="mt-1 font-display text-2xl">{order.product_name}</h1>
          {order.batch && (
            <p className="mt-1 font-mono text-xs text-mute">
              Payment ref: {order.batch.paystack_reference}
              {order.batch.siblingOrders?.length > 0 &&
                ` · ${order.batch.siblingOrders.length} other order${order.batch.siblingOrders.length === 1 ? '' : 's'} from the same checkout`}
            </p>
          )}
        </div>
        <Link
          href={`/admin/orders/${order.id}/invoice`}
          target="_blank"
          className="rounded-full border border-line px-4 py-2 text-xs text-bone"
        >
          View Invoice
        </Link>
      </div>

      {order.batch?.siblingOrders?.length > 0 && (
        <div className="mt-4 border border-line p-4">
          <p className="text-xs uppercase tracking-wide text-mute">Same checkout</p>
          <div className="mt-2 space-y-1">
            {order.batch.siblingOrders.map((sib) => (
              <Link
                key={sib.id}
                href={`/admin/orders/${sib.id}`}
                className="block text-sm text-bone hover:underline"
              >
                {sib.order_number} — {sib.product_name} ({sib.status})
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="border border-line p-5">
          <p className="text-xs uppercase tracking-wide text-mute">Product</p>
          <div className="mt-3 flex gap-4">
            {order.product_image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={order.product_image} alt="" className="h-24 w-20 object-cover" />
            )}
            <div className="text-sm">
              <p>{order.product_name}</p>
              <p className="mt-1 text-mute">
                {order.variant_color} · {order.variant_size} · Qty {order.quantity}
              </p>
              {order.authenticityTag && (
                <p className="mt-1 font-mono text-xs text-mute">{order.authenticityTag}</p>
              )}
              <p className="mt-2 font-mono text-bone">{formatNGN(order.product_price)}</p>
            </div>
          </div>
        </div>

        <div className="border border-line p-5">
          <p className="text-xs uppercase tracking-wide text-mute">Customer</p>
          <div className="mt-3 space-y-1 text-sm">
            <p>{order.profiles?.full_name || '—'}</p>
            <p className="text-mute">{order.profiles?.email}</p>
            {order.profiles?.phone && <p className="text-mute">{order.profiles.phone}</p>}
          </div>
          <p className="mt-4 text-xs text-mute">
            Paid {order.paid_at ? new Date(order.paid_at).toLocaleString() : '—'}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <OrderStatusControl orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="mt-6">
        <WarehouseForm orderId={order.id} warehouseItem={order.warehouseItem} />
      </div>
    </div>
  );
}
