/**
 * CUSTOMER DISPLAY CURRENCY — completely separate from:
 *  - pricingConfig.usdToNgn (sourcing/accounting math baked into saved product prices)
 *  - freight.js's own rate (the real customer delivery charge)
 *  - Paystack, which is never sent anything but NGN
 *
 * This rate affects NOTHING charged or stored — only how an
 * already-fixed NGN price is displayed to someone who selected USD.
 *
 * ⚠️ PLACEHOLDER. Do not treat this as a production-accurate FX rate.
 * Update it here — the one place it lives — when you have a real rate
 * you're comfortable displaying. Deliberately not a live FX API call,
 * per instruction: a live third-party rate could show a customer a
 * price that silently drifts between page loads.
 */
export const DISPLAY_USD_RATE = 1450; // NGN per USD

export function convertForDisplay(amountNgn, currency) {
  if (currency === 'USD') return amountNgn / DISPLAY_USD_RATE;
  return amountNgn;
}

/** Customer-facing formatter — NEVER use this for admin/internal amounts, use formatNGN for those. */
export function formatPrice(amountNgn, currency) {
  if (currency === 'USD') {
    const converted = convertForDisplay(amountNgn, currency);
    return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₦${amountNgn.toLocaleString('en-NG')}`;
}
