'use client';

import { useState, useMemo } from 'react';
import { formatPrice } from '@/lib/currency';
import { useCurrency } from '@/components/CurrencyContext';
import { calculatePlanningDelivery, FREIGHT_CONFIG, getEtaLabel } from '@/lib/freight';
import { getConfiguredStates } from '@/lib/domesticDelivery';

export default function DeliveryCalculator() {
  const { currency } = useCurrency();
  const [weight, setWeight] = useState('');
  const [state, setState] = useState('');

  const result = useMemo(() => {
    if (!weight || !state) return null;
    return calculatePlanningDelivery(Number(weight), state);
  }, [weight, state]);

  const states = getConfiguredStates();

  return (
    <div className="border border-rule bg-canvas-alt p-6">
      <p className="text-xs uppercase tracking-wide text-ink-fog">Estimate your delivery</p>

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
        <div>
          <label className="text-xs text-ink-fog">Destination state</label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="mt-1.5 w-full border border-rule bg-canvas px-3 py-2.5 text-sm text-ink focus:border-ink"
          >
            <option value="">Select state</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
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
          {result.needsConfirmation ? (
            <p className="mt-2 text-sm text-ink">
              Delivery to {state} — rate to be confirmed. Reach out and we'll get you an exact figure.
            </p>
          ) : (
            <p className="mt-2 font-mono text-lg text-ink">
              {formatPrice(result.total, currency)}
              <span className="ml-2 font-sans text-xs text-ink-fog">estimated delivery to {state}</span>
            </p>
          )}
          <p className="mt-2 text-xs text-ink-fog">
            This is a planning estimate. Your final delivery charge is calculated from the actual
            chargeable weight once your shipment is packed and ready — paid separately at that point.
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-ink-fog">Estimated timeframe: {getEtaLabel()}</p>
    </div>
  );
}
