'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatNGN } from '@/lib/format';
import { initiateCartCheckout } from '@/lib/account/checkout';
import { useCart } from './CartContext';

export default function CheckoutClient() {
  const { items, totalPrice, hydrated, lineKey } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);

  async function handlePay() {
    setLoading(true);
    setError('');
    setNeedsAuth(false);

    const result = await initiateCartCheckout(items);

    if (result?.error === 'not_authenticated') {
      setNeedsAuth(true);
      setLoading(false);
      return;
    }
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    if (result?.authorizationUrl) {
      // Cart is cleared once payment is confirmed (on the callback page),
      // not here — if the customer abandons the Paystack page, their cart
      // is still intact when they come back.
      window.location.href = result.authorizationUrl;
    }
  }

  if (!hydrated) return null;

  if (items.length === 0) {
    return (
      <div className="border border-rule bg-canvas-alt p-6 text-center text-ink-fog">
        <p>Your cart is empty.</p>
        <Link href="/shop" className="mt-3 inline-block text-ink hover:underline">
          Browse the shop
        </Link>
      </div>
    );
  }

  const currentPath = '/checkout';

  return (
    <div className="border border-rule bg-canvas-alt p-6 text-ink">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={lineKey(item)} className="flex gap-4 border-b border-rule pb-4 last:border-b-0 last:pb-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt={item.name} className="h-20 w-16 object-cover" />
            <div className="flex-1">
              <p className="text-sm text-ink">{item.name}</p>
              <p className="mt-1 text-xs text-ink-fog">
                {item.color} · {item.size} · Qty {item.quantity}
              </p>
            </div>
            <span className="font-mono text-sm text-ink">{formatNGN(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2 border-t border-rule pt-4 font-mono text-sm">
        <div className="flex justify-between text-ink-fog">
          <span>Products ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
          <span>{formatNGN(totalPrice)}</span>
        </div>
        <div className="flex justify-between text-ink-fog">
          <span>Shipping</span>
          <span>Paid later, from your warehouse</span>
        </div>
        <div className="flex justify-between border-t border-rule pt-2 text-base text-ink">
          <span>Pay now</span>
          <span>{formatNGN(totalPrice)}</span>
        </div>
      </div>

      {needsAuth ? (
        <div className="mt-6 border border-rule bg-canvas p-4 text-sm">
          <p className="text-ink">You need an account to check out.</p>
          <div className="mt-3 flex gap-3">
            <Link
              href={`/login?redirect=${encodeURIComponent(currentPath)}`}
              className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-canvas"
            >
              Sign in
            </Link>
            <Link
              href={`/signup?redirect=${encodeURIComponent(currentPath)}`}
              className="rounded-full border border-ink px-4 py-2 text-xs text-ink"
            >
              Create account
            </Link>
          </div>
        </div>
      ) : (
        <button
          onClick={handlePay}
          disabled={loading}
          className="mt-6 w-full rounded-full bg-ink py-4 text-sm font-medium text-canvas transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {loading ? 'Redirecting to Paystack…' : `Pay ${formatNGN(totalPrice)} with Paystack`}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-ink-fog">{error}</p>}
    </div>
  );
}
