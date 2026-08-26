'use client';

import Link from 'next/link';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/CartContext';
import { formatNGN } from '@/lib/format';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, lineKey, hydrated } = useCart();

  const distinctProducts = new Set(items.map((i) => i.productSlug)).size;

  function checkoutHref() {
    // The existing checkout page reads a single product/color/size/qty
    // from the URL — that flow is intentionally left untouched here. For
    // a single cart line, we can feed it straight in. For more than one,
    // see the notice below and the report in this response: true
    // multi-item Paystack checkout needs a backend change, not something
    // to silently paper over from this page.
    const first = items[0];
    if (!first) return '/checkout';
    return `/checkout?product=${encodeURIComponent(first.productSlug)}&color=${encodeURIComponent(
      first.color
    )}&size=${encodeURIComponent(first.size)}&qty=${first.quantity}`;
  }

  if (!hydrated) return null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">Your bag</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">Cart</h1>

      {items.length === 0 ? (
        <div className="mt-14 flex flex-col items-center text-center">
          <ShoppingBag size={32} className="text-ink-fog" />
          <p className="mt-4 text-ink-fog">Your cart is empty.</p>
          <Link
            href="/shop"
            className="mt-6 rounded-full bg-ink px-7 py-3 text-sm font-medium text-canvas"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-10 divide-y divide-rule border-t border-b border-rule">
            {items.map((item) => {
              const key = lineKey(item);
              return (
                <div key={key} className="flex gap-4 py-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.name} className="h-28 w-22 object-cover" />
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-sm text-ink">{item.name}</p>
                      <p className="mt-1 text-xs text-ink-fog">
                        {item.color} · {item.size}
                      </p>
                      <p className="mt-1 font-mono text-sm text-ink">{formatNGN(item.price)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 rounded-full border border-rule px-2 py-1">
                        <button
                          onClick={() => updateQuantity(key, item.quantity - 1)}
                          className="p-1 text-ink/80 hover:text-ink"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-5 text-center font-mono text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(key, item.quantity + 1)}
                          className="p-1 text-ink/80 hover:text-ink"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(key)}
                        className="text-xs text-ink-fog underline underline-offset-2 hover:text-ink"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <span className="font-mono text-sm text-ink">{formatNGN(item.price * item.quantity)}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between font-mono text-base">
            <span className="text-ink-fog">Subtotal</span>
            <span className="text-ink">{formatNGN(totalPrice)}</span>
          </div>

          {distinctProducts > 1 && (
            <p className="mt-3 text-xs text-ink-fog">
              Checkout currently processes one product at a time — proceeding will start checkout
              with the first item in your cart.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="flex flex-1 items-center justify-center rounded-full border border-ink px-7 py-3.5 text-sm font-medium text-ink"
            >
              Continue Shopping
            </Link>
            <Link
              href={checkoutHref()}
              className="flex flex-1 items-center justify-center rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-canvas transition-transform hover:scale-[1.01]"
            >
              Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
