/**
 * REAL POST-PURCHASE SHIPPING CHARGE
 * ------------------------------------
 * This is the actual charge customers pay once their warehouse items are
 * combined and a real shipment is prepared (lib/account/warehouse.js,
 * lib/admin/orders.js) — as opposed to lib/freight.js, which is the
 * public, pre-order PLANNING calculator only.
 *
 * Deliberately has its own rate/minimum, separate from
 * pricingConfig.freightRatePerKgUsd (which stays exactly as it was —
 * that number is baked into every already-saved product's retail price,
 * and changing it here must never retroactively change product prices).
 */
export const SHIPPING_CONFIG = {
  internationalRatePerKgUsd: 9, // the real current rate — was stale in pricingConfig
  minChargeableWeightKg: 1,
  usdToNgn: 1450,
  clearanceFeePerKgNgn: 1000,
};

/**
 * Courier options for shipping items out of the warehouse.
 */
export const COURIERS = [
  { value: 'standard', label: 'Standard', etaDays: '10–15', rateMultiplier: 1 },
  { value: 'express', label: 'Express', etaDays: '5–8', rateMultiplier: 1.4 },
];

/**
 * Estimates the cost to ship a given total weight out of the warehouse.
 * Enforces the 1kg minimum chargeable weight — a 0.4kg parcel is charged
 * as 1kg, matching the same rule the public calculator states up front.
 */
export function calculateShippingCost(totalWeightKg, courierValue = 'standard', config = SHIPPING_CONFIG) {
  const courier = COURIERS.find((c) => c.value === courierValue) || COURIERS[0];
  const weight = Math.max(Number(totalWeightKg) || 0, config.minChargeableWeightKg);

  const freightNgn = weight * config.internationalRatePerKgUsd * config.usdToNgn * courier.rateMultiplier;
  const clearanceNgn = weight * config.clearanceFeePerKgNgn;

  return Math.round(freightNgn + clearanceNgn);
}
