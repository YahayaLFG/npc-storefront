import { PRICING_CONFIG } from './pricingConfig';

export function roundToPremiumPrice(amount) {
  const remainder = amount % 1000;
  const base = amount - remainder;
  if (remainder <= 500) return base + 500;
  if (remainder <= 900) return base + 900;
  return base + 1500;
}

export function calculateNPCPrice(input, config = PRICING_CONFIG) {
  const {
    supplierPriceCny = 0,
    supplierPriceNgn = null,
    estimatedWeightKg = 0,
    warehouseShippingCny = 0,
    serviceFeeCny = 0,
  } = input;

  const supplierSideNgn =
    supplierPriceNgn !== null
      ? supplierPriceNgn
      : (supplierPriceCny + warehouseShippingCny + serviceFeeCny) * config.cnyToNgn;

  const freightNgn = estimatedWeightKg * config.freightRatePerKgUsd * config.usdToNgn;
  const clearanceNgn = estimatedWeightKg * config.clearanceFeePerKgNgn;

  const landedCost = supplierSideNgn + freightNgn + clearanceNgn;

  const marginAmount = landedCost * config.brandMarginPercent;
  const priceWithMargin = landedCost + marginAmount;

  const profitBeforeFloor = priceWithMargin - landedCost;
  const finalProfit = Math.max(profitBeforeFloor, config.minProfitFloorNgn);
  const priceBeforeRounding = landedCost + finalProfit;

  const npcSellingPrice = roundToPremiumPrice(priceBeforeRounding);
  const expectedProfit = npcSellingPrice - landedCost;
  const profitMargin = npcSellingPrice > 0 ? expectedProfit / npcSellingPrice : 0;

  return {
    supplierPrice: supplierPriceNgn !== null ? supplierPriceNgn : supplierPriceCny,
    estimatedWeightKg,
    warehouseShipping: warehouseShippingCny,
    serviceFee: serviceFeeCny,
    landedCost: Math.round(landedCost),
    npcSellingPrice,
    expectedProfit: Math.round(expectedProfit),
    profitMargin: Number(profitMargin.toFixed(3)),
  };
}
