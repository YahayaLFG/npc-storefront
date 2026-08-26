'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from './CartContext';
import { formatNGN } from '@/lib/format';

export default function CartOverlay({ open, onClose }) {
  const { items, removeItem, updateQuantity, totalPrice, lineKey } = useCart();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-bone">
      <div className="flex items-center justify-between border-b border-line px-5 py-5 md:px-8">
        <span className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tightest">
          <ShoppingBag size={20} />
          Cart
        </span>
        <button onClick={onClose} aria-label="Close cart">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 md:px-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-fog">Your cart is empty.</p>
            <Link
              href="/shop"
              onClick={onClose}
              className="mt-4 rounded-full bg-bone px-6 py-3 text-sm font-medium text-black"
            >
              Shop
            </Link>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-5">
            {items.map((item) => {
              const key = lineKey(item);
              return (
                <div key={key} className="flex gap-4 border-b border-line pb-5">
                  <div className="h-24 w-20 shrink-0 overflow-hidden bg-panel">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{item.name}</p>
                    <p className="mt-1 text-xs text-mute">
                      {item.color} · {item.size}
                    </p>
                    <p className="mt-1 font-mono text-sm text-bone">{formatNGN(item.price)}</p>

                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-3 rounded-full border border-line px-2 py-1">
                        <button
                          onClick={() => updateQuantity(key, item.quantity - 1)}
                          className="p-1 text-bone/80 hover:text-bone"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-5 text-center font-mono text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(key, item.quantity + 1)}
                          className="p-1 text-bone/80 hover:text-bone"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(key)}
                        className="text-xs text-mute underline underline-offset-2 hover:text-bone"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-line px-5 py-5 md:px-8">
          <div className="mx-auto flex max-w-2xl items-center justify-between font-mono text-sm">
            <span className="text-mute">Total</span>
            <span className="text-bone">{formatNGN(totalPrice)}</span>
          </div>
          <Link
            href="/checkout"
            onClick={onClose}
            className="mx-auto mt-4 flex max-w-2xl items-center justify-center rounded-full bg-bone py-4 text-sm font-medium text-black transition-transform hover:scale-[1.01]"
          >
            Checkout — {formatNGN(totalPrice)}
          </Link>
        </div>
      )}
    </div>
  );
}
