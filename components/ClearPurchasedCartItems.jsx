'use client';

import { useEffect, useRef } from 'react';
import { useCart } from './CartContext';

/**
 * Removes exactly the purchased lines from the cart, matched by
 * product+color+size — not a blanket clear(), in case something else was
 * added to the cart in the time between starting checkout and paying.
 * Runs once per mount; safe if the confirmation page is refreshed since
 * removeItem on an already-absent line is a no-op.
 */
export default function ClearPurchasedCartItems({ purchasedLines }) {
  const { removeItem } = useCart();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    for (const line of purchasedLines || []) {
      removeItem(`${line.productSlug}:${line.color}:${line.size}`);
    }
  }, [purchasedLines, removeItem]);

  return null;
}
