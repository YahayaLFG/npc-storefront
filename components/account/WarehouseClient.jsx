'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { Truck } from 'lucide-react';
import { formatNGN } from '@/lib/format';
import { COURIERS, calculateShippingCost } from '@/lib/shipping';
import { extendMyStorage, initiateShipmentCheckout } from '@/lib/account/warehouse';

function daysLeftFor(item) {
  const expiry =
    new Date(item.received_at).getTime() + (item.free_storage_days + item.extended_days) * 86400000;
  return Math.ceil((expiry - Date.now()) / 86400000);
}

function WarehouseItemCard({ item, selected, onToggle, isPending }) {
  const daysLeft = daysLeftFor(item);
  const [extending, setExtending] = useState(false);

  function handleExtend() {
    setExtending(true);
    extendMyStorage(item.id, 7)
      .then(() => window.location.reload())
      .catch((err) => alert(err.message))
      .finally(() => setExtending(false));
  }

  return (
    <div className={`flex gap-4 border p-4 ${selected ? 'border-ink bg-canvas-alt' : 'border-rule'}`}>
      <label className="flex items-start pt-1">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(item.id)}
          disabled={isPending}
          className="h-4 w-4 accent-ink"
        />
      </label>

      <div className="h-20 w-16 shrink-0 overflow-hidden bg-canvas-alt">
        {(item.photos?.[0] || item.orders?.product_image) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photos?.[0] || item.orders?.product_image} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{item.orders?.product_name}</p>
        <p className="mt-0.5 text-xs text-ink-fog">
          {item.orders?.variant_color} · {item.orders?.variant_size}
        </p>
        <p className="mt-1 font-mono text-xs text-ink-fog">{item.orders?.order_number}</p>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink-fog">
          {item.weight_kg ? <span>{item.weight_kg} kg</span> : <span>Weight pending</span>}
          {item.length_cm && (
            <span>
              {item.length_cm}×{item.width_cm}×{item.height_cm} cm
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-3">
          <span className={`text-xs ${daysLeft <= 0 ? 'text-ink' : 'text-ink-fog'}`}>
            {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} free storage left` : 'Free storage expired'}
          </span>
          <button
            onClick={handleExtend}
            disabled={extending}
            className="text-xs text-ink underline underline-offset-2 disabled:opacity-50"
          >
            {extending ? 'Extending…' : '+7 days'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WarehouseClient({ items }) {
  const unshipped = items.filter((i) => !i.shipment_id);
  const shipped = items.filter((i) => i.shipment_id);

  const [selected, setSelected] = useState([]);
  const [courier, setCourier] = useState('standard');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const selectedItems = unshipped.filter((i) => selected.includes(i.id));
  const totalWeight = selectedItems.reduce((sum, i) => sum + (Number(i.weight_kg) || 0), 0);
  const estimatedCost = useMemo(() => calculateShippingCost(totalWeight, courier), [totalWeight, courier]);
  const missingWeight = selectedItems.some((i) => !i.weight_kg);

  function handleShip() {
    setError('');
    startTransition(async () => {
      const result = await initiateShipmentCheckout({ itemIds: selected, courier });
      if (result?.error === 'not_authenticated') {
        setError('Please sign in again.');
        return;
      }
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      }
    });
  }

  return (
    <div className={selected.length > 0 ? 'pb-32' : ''}>
      {unshipped.length === 0 && shipped.length === 0 && (
        <div className="mt-14 text-center text-ink-fog">
          <p>Nothing in your warehouse yet.</p>
          <Link href="/shop" className="mt-3 inline-block text-ink hover:underline">
            Browse the shop
          </Link>
        </div>
      )}

      {unshipped.length > 0 && (
        <div>
          <h2 className="font-display text-lg text-ink">In your warehouse</h2>
          <p className="mt-1 text-sm text-ink-fog">
            Select items below to combine into one shipment and split the shipping cost.
          </p>
          <div className="mt-5 space-y-3">
            {unshipped.map((item) => (
              <WarehouseItemCard
                key={item.id}
                item={item}
                selected={selected.includes(item.id)}
                onToggle={toggle}
                isPending={isPending}
              />
            ))}
          </div>
        </div>
      )}

      {shipped.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-lg text-ink">Already shipped</h2>
          <div className="mt-5 divide-y divide-rule border-t border-b border-rule">
            {shipped.map((item) => (
              <Link
                key={item.id}
                href={`/account/shipments/${item.shipment_id}`}
                className="flex items-center gap-4 py-4"
              >
                <div className="h-16 w-14 shrink-0 overflow-hidden bg-canvas-alt">
                  {item.orders?.product_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.orders.product_image} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-ink">{item.orders?.product_name}</p>
                  <p className="mt-1 text-xs text-ink-fog">View shipment →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-canvas/98 backdrop-blur">
          <div className="mx-auto max-w-4xl px-5 py-4 md:px-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink">
                {selected.length} item{selected.length === 1 ? '' : 's'} selected
              </span>
              <span className="font-mono text-ink-fog">{totalWeight.toFixed(2)} kg</span>
            </div>

            <div className="mt-3 flex gap-2">
              {COURIERS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCourier(c.value)}
                  className={`flex-1 border px-3 py-2 text-xs ${
                    courier === c.value ? 'border-ink bg-ink text-canvas' : 'border-rule text-ink-fog'
                  }`}
                >
                  {c.label} · {c.etaDays}d
                </button>
              ))}
            </div>

            {missingWeight ? (
              <p className="mt-3 text-xs text-ink-fog">
                One or more selected items don't have a weight yet — remove them or wait for warehouse
                measurement.
              </p>
            ) : (
              <button
                onClick={handleShip}
                disabled={isPending}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-medium text-canvas disabled:opacity-60"
              >
                <Truck size={16} />
                {isPending ? 'Redirecting to Paystack…' : `Ship Selected — ${formatNGN(estimatedCost)}`}
              </button>
            )}
            {error && <p className="mt-2 text-xs text-ink-fog">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
