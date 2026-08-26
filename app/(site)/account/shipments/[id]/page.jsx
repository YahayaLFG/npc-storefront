import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { getMyShipmentById } from '@/lib/account/warehouse';
import { SHIPMENT_STATUSES } from '@/lib/orderStatus';
import { formatNGN } from '@/lib/format';

export default async function ShipmentDetailPage({ params, searchParams }) {
  const shipment = await getMyShipmentById(params.id);

  if (!shipment) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-fog">Not found</p>
        <h1 className="mt-3 font-display text-2xl text-ink">We couldn't find that shipment.</h1>
        <Link href="/account/warehouse" className="mt-6 inline-block text-ink hover:underline">
          Back to my warehouse
        </Link>
      </div>
    );
  }

  const currentIndex = SHIPMENT_STATUSES.findIndex((s) => s.value === shipment.status);

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 md:px-8 md:py-20">
      {searchParams?.confirmed === '1' && (
        <div className="mb-10 flex items-center gap-3 border border-rule bg-canvas-alt p-4">
          <CheckCircle2 size={22} className="shrink-0 text-ink" />
          <p className="text-sm text-ink">Shipping paid — your combined shipment is being packed.</p>
        </div>
      )}

      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">
        Shipment · {shipment.courier}
      </p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
        {shipment.items.length} item{shipment.items.length === 1 ? '' : 's'} combined
      </h1>

      <div className="mt-8 divide-y divide-rule border-t border-b border-rule">
        {shipment.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 py-4">
            <div className="h-16 w-14 shrink-0 overflow-hidden bg-canvas-alt">
              {(item.photos?.[0] || item.orders?.product_image) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photos?.[0] || item.orders?.product_image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-ink">{item.orders?.product_name}</p>
              <p className="mt-1 text-xs text-ink-fog">
                {item.orders?.variant_color} · {item.orders?.variant_size} · {item.weight_kg} kg
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between border border-rule bg-canvas-alt p-5 font-mono text-sm">
        <span className="text-ink-fog">Total weight / shipping paid</span>
        <span className="text-ink">
          {shipment.total_weight_kg} kg — {formatNGN(shipment.shipping_cost)}
        </span>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg text-ink">Tracking</h2>
        <ol className="mt-5">
          {SHIPMENT_STATUSES.map((s, i) => {
            const isDone = i <= currentIndex;
            return (
              <li key={s.value} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={`h-2.5 w-2.5 rounded-full border ${isDone ? 'border-ink bg-ink' : 'border-rule bg-canvas'}`} />
                  {i < SHIPMENT_STATUSES.length - 1 && (
                    <span className={`w-px flex-1 ${isDone ? 'bg-ink' : 'bg-rule'}`} style={{ minHeight: 24 }} />
                  )}
                </div>
                <p className={`pb-6 text-sm ${isDone ? 'text-ink' : 'text-ink-fog'}`}>{s.label}</p>
              </li>
            );
          })}
        </ol>
      </div>

      <Link
        href={`/account/shipments/${shipment.id}/invoice`}
        target="_blank"
        className="text-sm text-ink underline underline-offset-2"
      >
        View invoice
      </Link>
    </div>
  );
}
