/**
 * NPC PRICING CONFIG
 * -------------------
 * The single source of truth for how prices are calculated. Every product
 * saved through the admin dashboard is priced using these numbers at the
 * moment it's saved.
 */

export const PRICING_CONFIG = {
  // ⚠️ Placeholder — confirm today's actual CNY→NGN rate before pricing
  // real products in CNY.
  cnyToNgn: 197,

  // ₦ per USD
  usdToNgn: 1420,

  // USD per kg, converted to NGN internally using usdToNgn
  freightRatePerKgUsd: 7.9,

  // NGN per kg
  clearanceFeePerKgNgn: 1000,

  // Applied to landed cost, e.g. 0.18 = 18%
  brandMarginPercent: 0.18,

  // Guaranteed minimum profit in NGN, even if the margin % would fall short
  minProfitFloorNgn: 5000,
};
