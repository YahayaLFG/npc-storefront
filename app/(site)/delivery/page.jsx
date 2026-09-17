import { Truck, PackageCheck, Clock } from 'lucide-react';
import DeliveryCalculator from './DeliveryCalculator';
import { FREIGHT_CONFIG, getEtaLabel } from '@/lib/freight';

export const metadata = { title: 'Freight & Delivery — NPC' };

export default function DeliveryPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">Freight &amp; Delivery</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
        Door-to-door, handled end to end
      </h1>
      <p className="mt-4 max-w-lg text-ink-fog">
        Every NPC order is delivered straight to your door, anywhere in Nigeria. Here's exactly
        how delivery pricing works, so there are no surprises.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="border border-rule p-5">
          <Truck size={20} className="text-ink" />
          <p className="mt-3 text-sm text-ink">Door-to-door</p>
          <p className="mt-1 text-xs text-ink-fog">Delivered directly to your address, nationwide.</p>
        </div>
        <div className="border border-rule p-5">
          <PackageCheck size={20} className="text-ink" />
          <p className="mt-3 text-sm text-ink">${FREIGHT_CONFIG.internationalRatePerKgUsd}/kg basis</p>
          <p className="mt-1 text-xs text-ink-fog">
            Minimum chargeable weight {FREIGHT_CONFIG.minChargeableWeightKg}kg. A 0.4kg parcel is
            charged as {FREIGHT_CONFIG.minChargeableWeightKg}kg; a 1.8kg parcel is charged at 1.8kg.
          </p>
        </div>
        <div className="border border-rule p-5">
          <Clock size={20} className="text-ink" />
          <p className="mt-3 text-sm text-ink">Timeframe</p>
          <p className="mt-1 text-xs text-ink-fog">{getEtaLabel()}</p>
        </div>
      </div>

      <div className="mt-10 space-y-3 text-sm leading-relaxed text-ink-fog">
        <p>
          Your product payment and delivery are billed separately. When you check out, you pay
          for the product itself, plus NPC's service and order handling fees. Once your item
          reaches our fulfillment warehouse and is ready to ship, we confirm the exact chargeable
          weight and you pay one combined NPC delivery price at that point — never before.
        </p>
        <p>
          The calculator below is a planning tool, using your expected weight, so you can budget
          ahead of ordering. Your actual delivery charge is calculated from the real chargeable
          weight once your shipment is packed and ready to go — it may differ slightly from this
          estimate.
        </p>
      </div>

      <div className="mt-10">
        <DeliveryCalculator />
      </div>
    </div>
  );
}
