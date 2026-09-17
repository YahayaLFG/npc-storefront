'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/currency';
import { useCurrency } from './CurrencyContext';
import { previewCheckoutFees, initiateCartCheckout } from '@/lib/account/checkout';
import { useCart } from './CartContext';
import AddressForm from './account/AddressForm';

export default function CheckoutClient({ initialAddresses = [] }) {
  const { items, selectedItems, selectedTotalPrice, hydrated, lineKey } = useCart();
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);

  const [addresses, setAddresses] = useState(initialAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(
    initialAddresses.find((a) => a.is_default)?.id || initialAddresses[0]?.id || null
  );
  const [addingAddress, setAddingAddress] = useState(initialAddresses.length === 0);

  // Real fee breakdown, computed server-side (previewCheckoutFees calls
  // the exact same calculateCheckoutFees() the actual charge uses, on
  // the same grouping logic) — the browser never sees which items share
  // a fulfillment group, only the resulting numbers. Still never trusted
  // as the charge itself: initiateCartCheckout recomputes independently
  // at payment time regardless of what's displayed here.
  const [fees, setFees] = useState(null);
  const [feesLoading, setFeesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setFeesLoading(true);
    previewCheckoutFees(selectedItems)
      .then((result) => {
        if (!cancelled) setFees(result?.error ? null : result);
      })
      .finally(() => {
        if (!cancelled) setFeesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedItems]);

  const paystackAmountNgn = fees ? selectedTotalPrice + fees.serviceFee + fees.fulfillmentFee : null;

  function handleAddressSaved(address) {
    setAddresses((prev) => {
      const exists = prev.some((a) => a.id === address.id);
      return exists ? prev.map((a) => (a.id === address.id ? address : a)) : [address, ...prev];
    });
    setSelectedAddressId(address.id);
    setAddingAddress(false);
  }

  async function handlePay() {
    if (!selectedAddressId) {
      setError('Add or select a delivery address before paying.');
      return;
    }

    setLoading(true);
    setError('');
    setNeedsAuth(false);

    const result = await initiateCartCheckout(selectedItems, { addressId: selectedAddressId });

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

  if (selectedItems.length === 0) {
    return (
      <div className="border border-rule bg-canvas-alt p-6 text-center text-ink-fog">
        <p>Select at least one item in your cart to check out.</p>
        <Link href="/cart" className="mt-3 inline-block text-ink hover:underline">
          Back to cart
        </Link>
      </div>
    );
  }

  const currentPath = '/checkout';

  return (
    <div className="space-y-6">
      {/* DELIVERY ADDRESS */}
      <div className="border border-rule bg-canvas-alt p-6 text-ink">
        <p className="text-xs uppercase tracking-wide text-ink-fog">Delivery Address</p>

        {addresses.length > 0 && !addingAddress && (
          <div className="mt-3 space-y-2">
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className={`flex cursor-pointer items-start gap-3 border p-3 text-sm ${
                  selectedAddressId === addr.id ? 'border-ink' : 'border-rule'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className="mt-1 h-4 w-4 accent-ink"
                />
                <span>
                  <span className="block text-ink">{addr.full_name} — {addr.phone}</span>
                  <span className="block text-ink-fog">
                    {addr.address_line_1}
                    {addr.address_line_2 && `, ${addr.address_line_2}`}
                  </span>
                  <span className="block text-ink-fog">
                    {[addr.area, addr.city, addr.state].filter(Boolean).join(', ')}
                  </span>
                </span>
              </label>
            ))}
            <button
              onClick={() => setAddingAddress(true)}
              className="text-xs text-ink underline underline-offset-2"
            >
              + Use a different address
            </button>
          </div>
        )}

        {addingAddress && (
          <div className="mt-3">
            <AddressForm
              onSaved={handleAddressSaved}
              onCancel={addresses.length > 0 ? () => setAddingAddress(false) : undefined}
            />
          </div>
        )}
      </div>

      {/* ITEMS + FEES */}
      <div className="border border-rule bg-canvas-alt p-6 text-ink">
        <div className="space-y-4">
          {selectedItems.map((item) => (
            <div key={lineKey(item)} className="flex gap-4 border-b border-rule pb-4 last:border-b-0 last:pb-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.name} className="h-20 w-16 object-cover" />
              <div className="flex-1">
                <p className="text-sm text-ink">{item.name}</p>
                <p className="mt-1 text-xs text-ink-fog">
                  {item.color} · {item.size} · Qty {item.quantity}
                </p>
              </div>
              <span className="font-mono text-sm text-ink">
                {formatPrice(item.price * item.quantity, currency)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2 border-t border-rule pt-4 font-mono text-sm">
          <div className="flex justify-between text-ink-fog">
            <span>Product Subtotal</span>
            <span>{formatPrice(selectedTotalPrice, currency)}</span>
          </div>

          {feesLoading || !fees ? (
            <div className="flex justify-between text-ink-fog">
              <span>Calculating fees…</span>
              <span>—</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-ink-fog">
                <span>NPC Service ({fees.totalPieces} {fees.totalPieces === 1 ? 'piece' : 'pieces'})</span>
                <span>{formatPrice(fees.serviceFee, currency)}</span>
              </div>
              <div className="flex justify-between text-ink-fog">
                <span>
                  Fulfillment &amp; Processing ({fees.groupCount} {fees.groupCount === 1 ? 'group' : 'groups'})
                </span>
                <span>{formatPrice(fees.fulfillmentFee, currency)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between text-ink-fog">
            <span>Delivery</span>
            <span>Paid later, once your shipment is ready</span>
          </div>
          <div className="flex justify-between border-t border-rule pt-2 text-base text-ink">
            <span>Pay now</span>
            <span>{paystackAmountNgn != null ? formatPrice(paystackAmountNgn, currency) : '—'}</span>
          </div>
          {currency !== 'NGN' && paystackAmountNgn != null && (
            <p className="pt-1 text-xs text-ink-fog">
              Charged as {formatPrice(paystackAmountNgn, 'NGN')} — Paystack always processes in Naira.
            </p>
          )}
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
            disabled={loading || feesLoading || !fees}
            className="mt-6 w-full rounded-full bg-ink py-4 text-sm font-medium text-canvas transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {loading
              ? 'Redirecting to Paystack…'
              : paystackAmountNgn != null
                ? `Pay ${formatPrice(paystackAmountNgn, currency)} with Paystack`
                : 'Calculating…'}
          </button>
        )}

        {error && <p className="mt-3 text-sm text-ink-fog">{error}</p>}
      </div>
    </div>
  );
}
