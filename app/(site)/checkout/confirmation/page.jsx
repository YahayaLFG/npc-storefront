import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { orderStatusLabel } from '@/lib/orderStatus';
import { formatNGN } from '@/lib/format';
import ClearPurchasedCartItems from '@/components/ClearPurchasedCartItems';

export default async function CheckoutConfirmationPage({ searchParams }) {
  const reference = searchParams?.ref;

  if (!reference) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="font-display text-2xl text-ink">Missing payment reference.</h1>
        <Link href="/account/orders" className="mt-6 inline-block text-ink hover:underline">
          Go to My Orders
        </Link>
      </div>
    );
  }

  const supabase = createClient();

  const { data: batch } = await supabase
    .from('order_batches')
    .select('*')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (!batch) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="font-display text-2xl text-ink">We couldn't find that payment.</h1>
        <Link href="/account/orders" className="mt-6 inline-block text-ink hover:underline">
          Go to My Orders
        </Link>
      </div>
    );
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('batch_id', batch.id)
    .order('created_at', { ascending: true });

  // Cart lines are keyed by product SLUG, but orders store product_id
  // (uuid) — resolve slugs here so the exact purchased lines can be
  // removed from the client-side cart, not a blanket clear.
  const productIds = [...new Set((orders || []).map((o) => o.product_id).filter(Boolean))];
  let slugById = {};
  if (productIds.length) {
    const { data: productsRows } = await supabase.from('public_products').select('id, slug').in('id', productIds);
    slugById = Object.fromEntries((productsRows || []).map((p) => [p.id, p.slug]));
  }
  const purchasedLines = (orders || [])
    .filter((o) => o.product_id && slugById[o.product_id])
    .map((o) => ({
      productSlug: slugById[o.product_id],
      color: o.variant_color || '',
      size: o.variant_size || '',
    }));

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 md:px-8 md:py-20">
      <ClearPurchasedCartItems purchasedLines={purchasedLines} />

      <div className="flex flex-col items-center text-center">
        <CheckCircle2 size={44} className="text-ink" />
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">
          Payment successful
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
          {formatNGN(batch.total_amount)} paid
        </h1>
        <p className="mt-2 font-mono text-xs text-ink-fog">Reference: {batch.paystack_reference}</p>
      </div>

      <div className="mt-10 divide-y divide-rule border-t border-b border-rule">
        {(orders || []).map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.order_number}`}
            className="flex items-center gap-4 py-4"
          >
            <div className="h-16 w-14 shrink-0 overflow-hidden bg-canvas-alt">
              {order.product_image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.product_image} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-ink">{order.product_name}</p>
              <p className="mt-1 text-xs text-ink-fog">
                {order.variant_color} · {order.variant_size} · Qty {order.quantity}
              </p>
              <p className="mt-1 font-mono text-xs text-ink-fog">{order.order_number}</p>
            </div>
            <span className="rounded-full border border-rule px-3 py-1 text-xs text-ink-fog">
              {orderStatusLabel(order.status)}
            </span>
            <span className="font-mono text-sm text-ink">{formatNGN(order.product_price)}</span>
          </Link>
        ))}
      </div>

      <Link
        href="/account/orders"
        className="mt-8 flex w-full items-center justify-center rounded-full bg-ink py-4 text-sm font-medium text-canvas transition-transform hover:scale-[1.01]"
      >
        View My Orders
      </Link>
    </div>
  );
}
