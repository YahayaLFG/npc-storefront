import Link from 'next/link';
import { CheckCircle2, Truck } from 'lucide-react';
import { getMyOrderByNumber, getWarehouseItemForOrder } from '@/lib/account/orders';
import { formatNGN } from '@/lib/format';
import OrderTrackingTimeline from '@/components/account/OrderTrackingTimeline';

export default async function OrderDetailPage({ params, searchParams }) {
  const order = await getMyOrderByNumber(params.orderNumber);

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-fog">Not found</p>
        <h1 className="mt-3 font-display text-2xl text-ink">We couldn't find that order.</h1>
        <Link href="/account/orders" className="mt-6 inline-block text-ink hover:underline">
          Back to my orders
        </Link>
      </div>
    );
  }

  const warehouseItem =
    order.status !== 'to_pay' && order.status !== 'pending_purchase' && order.status !== 'purchased'
      ? await getWarehouseItemForOrder(order.id)
      : null;

  const storageExpiry = warehouseItem
    ? new Date(
        new Date(warehouseItem.received_at).getTime() +
          (warehouseItem.free_storage_days + warehouseItem.extended_days) * 24 * 60 * 60 * 1000
      )
    : null;
  const daysLeft = storageExpiry
    ? Math.ceil((storageExpiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 md:px-8 md:py-20">
      {searchParams?.confirmed === '1' && (
        <div className="mb-10 flex items-center gap-3 border border-rule bg-canvas-alt p-4">
          <CheckCircle2 size={22} className="shrink-0 text-ink" />
          <p className="text-sm text-ink">Payment confirmed — your order is on its way to being purchased.</p>
        </div>
      )}

      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">Order {order.order_number}</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
        {order.product_name}
      </h1>

      <div className="mt-8 flex gap-4 border border-rule bg-canvas-alt p-5">
        {order.product_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={order.product_image} alt="" className="h-24 w-20 object-cover" />
        )}
        <div className="flex-1">
          <p className="text-sm text-ink">
            {order.variant_color} · {order.variant_size} · Qty {order.quantity}
          </p>
          <p className="mt-1 font-mono text-sm text-ink-fog">{formatNGN(order.product_price)}</p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg text-ink">Tracking</h2>
        <div className="mt-5">
          <OrderTrackingTimeline status={order.status} />
        </div>
      </div>

      {warehouseItem && (
        <div className="mt-4 border border-rule p-5">
          <h2 className="font-display text-lg text-ink">In your warehouse</h2>

          {warehouseItem.photos?.length > 0 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {warehouseItem.photos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="h-24 w-24 shrink-0 object-cover" />
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-sm text-ink-fog sm:grid-cols-4">
            {warehouseItem.weight_kg && (
              <div>
                <p className="text-[10px] uppercase tracking-wide">Weight</p>
                <p className="text-ink">{warehouseItem.weight_kg} kg</p>
              </div>
            )}
            {warehouseItem.length_cm && (
              <div>
                <p className="text-[10px] uppercase tracking-wide">Dimensions</p>
                <p className="text-ink">
                  {warehouseItem.length_cm}×{warehouseItem.width_cm}×{warehouseItem.height_cm} cm
                </p>
              </div>
            )}
          </div>

          {daysLeft !== null && !warehouseItem.shipment_id && (
            <div className="mt-4 flex items-center gap-3 border border-rule bg-canvas-alt px-4 py-3">
              <Truck size={16} className="shrink-0 text-ink-fog" />
              <p className="text-sm text-ink">
                {daysLeft > 0
                  ? `Free storage for ${daysLeft} more day${daysLeft === 1 ? '' : 's'}.`
                  : 'Free storage period has ended — extend storage or ship soon.'}
              </p>
            </div>
          )}

          {!warehouseItem.shipment_id && (
            <Link
              href="/account/warehouse"
              className="mt-4 inline-block text-sm text-ink underline underline-offset-2"
            >
              Manage in warehouse →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
