'use client';

import { useState, useMemo } from 'react';
import { formatPrice } from '@/lib/currency';
import { useCurrency } from '@/components/CurrencyContext';
import { calculatePlanningDelivery, FREIGHT_CONFIG, getEtaLabel } from '@/lib/freight';

export default function DeliveryCalculator() {
  const { currency } = useCurrency();
  const [weight, setWeight] = useState('');

  const result = useMemo(() => {
    if (!weight) return null;
    return calculatePlanningDelivery(Number(weight));
  }, [weight]);


  return (
    <div className="border border-rule bg-canvas-alt p-6">
      <p className="text-xs uppercase tracking-wide text-ink-fog">Estimate freight to Nigeria</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-ink-fog">Expected weight (kg)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 1.5"
            className="mt-1.5 w-full border border-rule bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-fog focus:border-ink"
          />
        </div>

      </div>

      {result && (
        <div className="mt-5 border-t border-rule pt-4">
          <p className="text-xs text-ink-fog">
            Chargeable weight: {result.chargeableWeight.toFixed(2)} kg
            {Number(weight) < FREIGHT_CONFIG.minChargeableWeightKg && (
              <span> (minimum chargeable weight is {FREIGHT_CONFIG.minChargeableWeightKg}kg)</span>
            )}
          </p>
          <p className="mt-2 font-mono text-lg text-ink">
            {formatPrice(result.total, currency)}
            <span className="ml-2 font-sans text-xs text-ink-fog">estimated freight to Nigeria</span>
          </p>
          <p className="mt-2 text-xs text-ink-fog">
            This is a planning estimate. Your final freight charge is calculated from the actual
            chargeable weight once your shipment is packed and ready — paid separately at that point. Pickup follows arrival; local delivery can be requested on WhatsApp and is priced separately.
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-ink-fog">Estimated timeframe: {getEtaLabel()}</p>
    </div>
  );
}
