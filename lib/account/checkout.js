'use server';

import { createClient } from '../supabase/server';
import { initializePaystackTransaction } from '../paystack';

function buildReference(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Starts checkout for the customer's whole cart: creates one order per
 * cart line item (status 'to_pay'), grouped under a single order_batches
 * row, and starts one Paystack transaction for the combined total.
 *
 * Each item still becomes its own independently-trackable order — the
 * batch only groups the PAYMENT. Prices are re-fetched from the database
 * here, never taken from the cart the browser sent, so a tampered
 * client-side cart can't under-charge.
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

  const slugs = [...new Set(cartItems.map((i) => i.productSlug))];
  const { data: products, error: productsError } = await supabase
    .from('public_products')
    .select('id, slug, name, image, price, authenticity_tag')
    .in('slug', slugs);

  if (productsError) return { error: productsError.message };

  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
  const missing = slugs.filter((s) => !bySlug[s]);
  if (missing.length) {
    return { error: 'One or more items in your cart are no longer available.' };
  }

  const productIds = products.map((p) => p.id);

  const { data: variantRows, error: variantError } = await supabase
    .from('product_variants')
    .select('product_id, color, sizes, out_of_stock_sizes, is_active')
    .in('product_id', productIds);

  if (variantError) return { error: variantError.message };

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
  }

  const orderRows = cartItems.map((item) => {
    const product = bySlug[item.productSlug];
    const qty = Math.max(1, Number(item.quantity) || 1);
    return {
      customer_id: user.id,
      product_id: product.id,
      product_name: product.name,
      product_image: product.image,
      variant_color: item.color || null,
      variant_size: item.size || null,
      quantity: qty,
      unit_price: product.price,
      product_price: product.price * qty,
      authenticity_tag: product.authenticity_tag || null,
      status: 'to_pay',
    };
  });

  const totalAmount = orderRows.reduce((sum, o) => sum + o.product_price, 0);
  const reference = buildReference('npc_cart');

  const { data: batch, error: batchError } = await supabase
    .from('order_batches')
    .insert({ customer_id: user.id, paystack_reference: reference, total_amount: totalAmount })
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
