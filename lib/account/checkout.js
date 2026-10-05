'use server';

import { createClient } from '../supabase/server';
import { createServiceRoleClient } from '../supabase/serviceRole';
import { initializePaystackTransaction } from '../paystack';
import { calculateCheckoutFees } from '../fees';

function buildReference(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Resolves each product to its fulfillment-group key. Two products
 * sourced from the same supplier/listing (same supplier_url) share one
 * group; different listings are different groups, even if visually
 * similar. Falls back to supplier_title, then to the product's own id,
 * so every product always resolves to SOME group rather than silently
 * merging with an unrelated one.
 *
 * Deliberately uses the service-role client, not the customer's own
 * session client — supplier_url/supplier_title are excluded from
 * public_products specifically so customers never see them, and while
 * Postgres RLS is row-level (not column-level, so the customer's own
 * client could technically also read these columns off an already-
 * visible row), routing this one internal lookup through service-role
 * keeps that boundary explicit and makes it structurally impossible for
 * this data to end up anywhere customer-facing by accident.
 */
async function resolveFulfillmentGroupsByProductId(productIds) {
  const serviceClient = createServiceRoleClient();
  const { data, error } = await serviceClient
    .from('products')
    .select('id, supplier_url, supplier_title')
    .in('id', productIds);

  if (error) throw new Error(error.message);

  const groupByProductId = new Map();
  for (const p of data) {
    const groupKey = p.supplier_url?.trim() || p.supplier_title?.trim() || `product:${p.id}`;
    groupByProductId.set(p.id, groupKey);
  }
  return groupByProductId;
}

/**
 * Looks up the customer-facing product data for a cart, shared by both
 * the real checkout and the fee preview — guarantees they can never
 * silently drift apart, since there's only one place this happens.
 */
async function resolveCartProducts(supabase, cartItems) {
  const slugs = [...new Set(cartItems.map((i) => i.productSlug))];
  const { data: products, error } = await supabase
    .from('public_products')
    .select('id, slug, name, image, price, authenticity_tag')
    .in('slug', slugs);

  if (error) return { error: error.message };

  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
  const missing = slugs.filter((s) => !bySlug[s]);
  if (missing.length) {
    return { error: 'One or more items in your cart are no longer available.' };
  }

  return { bySlug, productIds: products.map((p) => p.id) };
}

/**
 * Read-only fee breakdown for display before payment — used by
 * CheckoutClient to show the real Fulfillment & Processing grouping
 * without the browser ever seeing supplier data. Calls the exact same
 * calculateCheckoutFees() that initiateCartCheckout uses for the actual
 * charge, on the exact same grouping logic — this is a preview of the
 * real numbers, not a separate estimate, but it is still never trusted
 * as the source of truth for the actual Paystack amount.
 */
export async function previewCheckoutFees(cartItems) {
  if (!cartItems?.length) {
    return { serviceFee: 0, fulfillmentFee: 0, totalPieces: 0, groupCount: 0 };
  }

  const supabase = createClient();
  const resolved = await resolveCartProducts(supabase, cartItems);
  if (resolved.error) return { error: resolved.error };

  const groupByProductId = await resolveFulfillmentGroupsByProductId(resolved.productIds);

  const groupedItems = cartItems.map((item) => ({
    quantity: item.quantity,
    groupKey: groupByProductId.get(resolved.bySlug[item.productSlug].id),
  }));

  return calculateCheckoutFees(groupedItems);
}

/**
 * Starts checkout for the customer's whole cart: creates one order per
 * cart line item (status 'to_pay'), grouped under a single order_batches
 * row, and starts one Paystack transaction for the combined total.
 *
 * Each item still becomes its own independently-trackable order — the
 * batch only groups the PAYMENT. Prices are re-fetched from the database
 * here, never taken from the cart the browser sent, so a tampered
 * client-side cart can't under-charge. Variant-level price (when set)
 * is authoritative over the product's base price.
 *
 * The Paystack amount is: product subtotal + NPC Service (₦1,500/piece)
 * + Fulfillment & Processing (₦2,000 per distinct fulfillment group,
 * never per item and never a flat once-per-checkout fee) — delivery is
 * NEVER included here; it's a separate, later payment once actual
 * chargeable shipment weight is known (see lib/shipping.js).
 */
export async function initiateCartCheckout(cartItems) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'not_authenticated' };
  }

  if (!cartItems?.length) {
    return { error: 'Your cart is empty.' };
  }

  const resolved = await resolveCartProducts(supabase, cartItems);
  if (resolved.error) return { error: resolved.error };
  const { bySlug, productIds } = resolved;

  const { data: variantRows, error: variantError } = await supabase
    .from('product_variants')
    .select('product_id, color, sizes, out_of_stock_sizes, is_active, price')
    .in('product_id', productIds);

  if (variantError) return { error: variantError.message };

  const variantByItem = new Map();

  for (const item of cartItems) {
    const product = bySlug[item.productSlug];

    const variant = (variantRows || []).find(
      (v) =>
        v.product_id === product.id &&
        v.color === item.color &&
        v.is_active === true
    );

    if (!variant) {
      return {
        error: `"${product.name}" is no longer available in the selected color.`,
      };
    }

    if (!(variant.sizes || []).includes(item.size)) {
      return {
        error: `"${product.name}" is not available in the selected size.`,
      };
    }

    if ((variant.out_of_stock_sizes || []).includes(item.size)) {
      return {
        error: `"${product.name}" — ${item.size} is currently out of stock.`,
      };
    }

    variantByItem.set(item, variant);
  }

  const orderRows = cartItems.map((item) => {
    const product = bySlug[item.productSlug];
    const variant = variantByItem.get(item);
    const qty = Math.max(1, Number(item.quantity) || 1);
    // Authoritative unit price: variant override if set, else the
    // product's base price. Never anything the client sent.
    const unitPrice = variant.price ?? product.price;
    return {
      customer_id: user.id,
      product_id: product.id,
      product_name: product.name,
      product_image: product.image,
      variant_color: item.color || null,
      variant_size: item.size || null,
      quantity: qty,
      unit_price: unitPrice,
      product_price: unitPrice * qty,
      authenticity_tag: product.authenticity_tag || null,
      status: 'to_pay',
    };
  });

  const productSubtotal = orderRows.reduce((sum, o) => sum + o.product_price, 0);

  const groupByProductId = await resolveFulfillmentGroupsByProductId(productIds);
  const groupedItems = cartItems.map((item) => ({
    quantity: item.quantity,
    groupKey: groupByProductId.get(bySlug[item.productSlug].id),
  }));
  const { serviceFee, fulfillmentFee } = calculateCheckoutFees(groupedItems);

  const totalAmount = productSubtotal + serviceFee + fulfillmentFee;

  const reference = buildReference('npc_cart');

  const { data: batch, error: batchError } = await supabase
    .from('order_batches')
    .insert({
      customer_id: user.id,
      paystack_reference: reference,
      total_amount: totalAmount,
      shipping_address: { fulfillment_method: 'pickup', pickup_location: 'Chevron, Lagos' },
      shipping_address_id: null,
    })
    .select()
    .maybeSingle();

  if (batchError) return { error: batchError.message };

  const { error: ordersError } = await supabase
    .from('orders')
    .insert(orderRows.map((row) => ({ ...row, batch_id: batch.id })));

  if (ordersError) return { error: ordersError.message };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return {
      error:
        'NEXT_PUBLIC_APP_URL is not set — Paystack needs an absolute callback URL. Add it to your environment.',
    };
  }

  try {
    const transaction = await initializePaystackTransaction({
      email: user.email,
      amountNgn: totalAmount,
      reference,
      callbackUrl: `${appUrl}/checkout/callback`,
      metadata: { batchId: batch.id, kind: 'product_batch' },
    });

    return { authorizationUrl: transaction.authorization_url };
  } catch (err) {
    return { error: err.message };
  }
}
