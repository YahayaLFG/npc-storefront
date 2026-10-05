import { calculateShippingCost } from './shipping';

/**
 * PUBLIC FREIGHT & DELIVERY — PLANNING CALCULATOR
 * -------------------------------------------------
 * This is a customer-facing planning tool, not the real post-purchase
 * shipping charge (see lib/shipping.js for that — same rate/minimum,
 * but computed from actual chargeable weight once a shipment is packed).
 *
 * Centralized here, in one shape, so this can move into a Supabase
 * settings table later (item 12) without touching any call site — every
 * value below is a plain, replaceable constant, not scattered literals.
 */
export const FREIGHT_CONFIG = {
  internationalRatePerKgUsd: 9,
  minChargeableWeightKg: 1,
  // ⚠️ Not yet confirmed. Left null on purpose — the UI shows "delivery
  // timeframe to be confirmed" wherever these are null, rather than a
  // guessed range. Fill in real day counts once confirmed.
  etaDaysMin: null,
  etaDaysMax: null,
  // Same display-only USD/NGN conversion the currency switcher uses —
  // this is a REAL charge though (freight is priced in USD internally),
  // so it intentionally reuses the same rate customers already see
  // prices displayed in, not pricingConfig's separate sourcing rate.
  usdToNgnForFreight: 1450,
};

/** 0.4kg → 1kg, 1kg → 1kg, 1.8kg → 1.8kg — never charged below the minimum. */
export function calculateChargeableWeight(weightKg) {
  const weight = Number(weightKg) || 0;
  return Math.max(weight, FREIGHT_CONFIG.minChargeableWeightKg);
}

/** Estimate freight to Nigeria only; local delivery is arranged after arrival. */
export function calculatePlanningDelivery(weightKg) {
  const chargeableWeight = calculateChargeableWeight(weightKg);
  return {
    chargeableWeight,
    total: calculateShippingCost(weightKg),
    needsConfirmation: false,
  };
}

/** "10–15 days" once configured, or a clear placeholder until then. */
export function getEtaLabel() {
  if (FREIGHT_CONFIG.etaDaysMin == null || FREIGHT_CONFIG.etaDaysMax == null) {
    return 'Arrival timeframe to be confirmed';
  }
  return `${FREIGHT_CONFIG.etaDaysMin}–${FREIGHT_CONFIG.etaDaysMax} days`;
}
