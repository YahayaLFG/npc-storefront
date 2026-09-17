'use client';

import { useCurrency } from './CurrencyContext';
import { formatPrice } from '@/lib/currency';

/**
 * Drop-in replacement for formatNGN(amount) inside server-rendered pages.
 * A server component can't call useCurrency() directly (it's a client
 * context, backed by localStorage, which only exists in the browser) —
 * this small client component is the bridge: the server passes the raw
 * NGN number as a prop, and this renders it in whatever currency the
 * visitor has selected.
 */
export default function CurrencyPrice({ amountNgn, className }) {
  const { currency } = useCurrency();
  return <span className={className}>{formatPrice(amountNgn, currency)}</span>;
}
