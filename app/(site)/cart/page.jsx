'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Pencil, X, AlertCircle } from 'lucide-react';
import { useCart } from '@/components/CartContext';
import { formatPrice } from '@/lib/currency';
import { useCurrency } from '@/components/CurrencyContext';
import { getVariantOptionsForProduct } from '@/lib/cartVariantOptions';

function EditPanel({ item, onClose, onSave }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productName, setProductName] = useState('');
  const [variants, setVariants] = useState([]);
  const [color, setColor] = useState(item.color);
  const [size, setSize] = useState(item.size);

  useEffect(() => {
    getVariantOptionsForProduct(item.productSlug)
      .then((result) => {
        if (!result.found) {
          setError('This item is no longer available.');
        } else {
          setProductName(result.productName);
          setVariants(result.variants);
        }
      })
      .catch(() => setError('Could not check current availability. Try again.'))
      .finally(() => setLoading(false));
    // Runs once when the panel mounts (it's only ever mounted for one
    // specific item at a time) — deliberately not re-running on prop
    // changes, since item.productSlug never changes within one edit session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentVariant = variants.find((v) => v.color === color);

  function handleColorChange(newColor) {
    setColor(newColor);
    const newVariant = variants.find((v) => v.color === newColor);
    const firstAvailableSize = newVariant?.sizes.find(
      (s) => !newVariant.outOfStockSizes.includes(s)
    );
    setSize(firstAvailableSize || '');
  }

  function handleSave() {
    if (!color || !size) return;
    const newImage = currentVariant?.images?.[0] || item.image;
    onSave({ color, size, image: newImage });
  }

  return (
    <div className="border border-ink bg-canvas-alt p-4">
      {loading ? (
        <p className="text-sm text-ink-fog">Checking availability…</p>
      ) : error ? (
        <div className="flex items-start gap-2 text-sm text-ink-fog">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          <p className="text-xs uppercase tracking-wide text-ink-fog">{productName} — Color</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.color}
                type="button"
                onClick={() => handleColorChange(v.color)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  color === v.color ? 'border-ink bg-ink text-canvas' : 'border-rule text-ink hover:border-ink-fog'
                }`}
              >
                {v.color}
              </button>
            ))}
          </div>

          {currentVariant && (
            <>
              <p className="mt-4 text-xs uppercase tracking-wide text-ink-fog">Size</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {currentVariant.sizes.map((s) => {
                  const outOfStock = currentVariant.outOfStockSizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={outOfStock}
                      onClick={() => setSize(s)}
                      className={`border px-3 py-1.5 text-xs transition-colors ${
                        outOfStock
                          ? 'cursor-not-allowed border-rule text-ink-fog/40 line-through'
                          : size === s
                            ? 'border-ink bg-ink text-canvas'
                            : 'border-rule text-ink hover:border-ink-fog'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!color || !size}
              className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-canvas disabled:opacity-40"
            >
              Save
            </button>
            <button type="button" onClick={onClose} className="text-xs text-ink-fog underline underline-offset-2">
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    updateItem,
    toggleSelected,
    selectAll,
    deselectAll,
    allSelected,
    selectedTotalPrice,
    isSelected,
    lineKey,
    hydrated,
  } = useCart();
  const { currency } = useCurrency();

  const [editingKey, setEditingKey] = useState(null);

  if (!hydrated) return null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">Your bag</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">Cart</h1>

      {items.length === 0 ? (
        <div className="mt-14 flex flex-col items-center text-center">
          <ShoppingBag size={32} className="text-ink-fog" />
          <p className="mt-4 text-ink-fog">Your cart is empty.</p>
          <Link href="/shop" className="mt-6 rounded-full bg-ink px-7 py-3 text-sm font-medium text-canvas">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-10 flex items-center justify-between border-b border-rule pb-3">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => (allSelected ? deselectAll() : selectAll())}
                className="h-4 w-4 accent-ink"
              />
              Select all
            </label>
          </div>

          <div className="divide-y divide-rule border-b border-rule">
            {items.map((item) => {
              const key = lineKey(item);
              const selected = isSelected(item);
              const isEditing = editingKey === key;

              return (
                <div key={key} className="py-6">
                  <div className="flex gap-4">
                    <label className="flex items-start pt-1">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelected(key)}
                        className="h-4 w-4 accent-ink"
                      />
                    </label>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="h-28 w-22 bg-canvas-alt object-contain" />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="text-sm text-ink">{item.name}</p>
                        <p className="mt-1 text-xs text-ink-fog">
                          {item.color} · {item.size}
                        </p>
                        <p className="mt-1 font-mono text-sm text-ink">{formatPrice(item.price, currency)}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4">
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
                          onClick={() => setEditingKey(isEditing ? null : key)}
                          className="flex items-center gap-1 text-xs text-ink-fog underline underline-offset-2 hover:text-ink"
                        >
                          <Pencil size={12} />
                          {isEditing ? 'Close' : 'Edit'}
                        </button>
                        <button
                          onClick={() => removeItem(key)}
                          className="flex items-center gap-1 text-xs text-ink-fog underline underline-offset-2 hover:text-ink"
                        >
                          <X size={12} />
                          Remove
                        </button>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-ink">{formatPrice(item.price * item.quantity, currency)}</span>
                  </div>

                  {isEditing && (
                    <div className="mt-4 pl-9">
                      <EditPanel
                        item={item}
                        onClose={() => setEditingKey(null)}
                        onSave={(changes) => {
                          updateItem(key, changes);
                          setEditingKey(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between font-mono text-base">
            <span className="text-ink-fog">Selected subtotal</span>
            <span className="text-ink">{formatPrice(selectedTotalPrice, currency)}</span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="flex flex-1 items-center justify-center rounded-full border border-ink px-7 py-3.5 text-sm font-medium text-ink"
            >
              Continue Shopping
            </Link>
            <Link
              href="/checkout"
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
