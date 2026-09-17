/**
 * NPC CHECKOUT FEES
 * ------------------
 * Charged once, at initial checkout, alongside the product subtotal.
 * Delivery is NEVER included here — it's a separate, later payment
 * (see lib/shipping.js) once actual chargeable weight is known.
 *
 * Fulfillment & Processing is per DISTINCT fulfillment group in the
 * cart, not per checkout and not per item — two items from the same
 * supplier/listing group cost one ₦2,000 fee together; two items from
 * two different groups cost ₦4,000. This reflects that items sourced
 * from different suppliers/listings genuinely need separate handling
 * before they can be consolidated for the customer — never shown to the
 * customer as anything more specific than "Fulfillment & Processing."
 *
 * This is a pure function — it doesn't know or care HOW a group key was
 * derived (see lib/account/checkout.js for that, which is the only place
 * with access to the internal grouping data). That split matters: it's
 * what lets both the real checkout charge and the customer-facing preview
 * share this exact same calculation with zero risk of drifting apart.
 */
export const FEES_CONFIG = {
  serviceFeePerPieceNgn: 1500,
  fulfillmentFeePerGroupNgn: 2000,
};

/**
 * @param {Array<{quantity: number, groupKey: string}>} groupedItems
 */
export function calculateCheckoutFees(groupedItems) {
  const items = groupedItems || [];
  const totalPieces = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const serviceFee = totalPieces * FEES_CONFIG.serviceFeePerPieceNgn;

  const distinctGroups = new Set(items.map((i) => i.groupKey).filter(Boolean));
  const groupCount = distinctGroups.size;
  const fulfillmentFee = groupCount * FEES_CONFIG.fulfillmentFeePerGroupNgn;

  return { serviceFee, fulfillmentFee, totalPieces, groupCount };
}
