import { PRICING_CONFIG } from './pricingConfig';

/**
 * Courier options for shipping items out of the warehouse.
 */
export const COURIERS = [
  { value: 'standard', label: 'Standard', etaDays: '10–15', rateMultiplier: 1 },
  { value: 'express', label: 'Express', etaDays: '5–8', rateMultiplier: 1.4 },
];

/**
 * Estimates the cost to ship a given total weight out of the warehouse.
 */
export function calculateShippingCost(totalWeightKg, courierValue = 'standard', config = PRICING_CONFIG) {
  const courier = COURIERS.find((c) => c.value === courierValue) || COURIERS[0];
  const weight = Number(totalWeightKg) || 0;

  const freightNgn = weight * config.freightRatePerKgUsd * config.usdToNgn * courier.rateMultiplier;
  const clearanceNgn = weight * config.clearanceFeePerKgNgn;

  return Math.round(freightNgn + clearanceNgn);
}
