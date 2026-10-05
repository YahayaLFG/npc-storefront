'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Truck, Minus, Plus, Ruler, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { useCurrency } from './CurrencyContext';
import SizeGuideTable from './SizeGuideTable';
import { useCart } from './CartContext';

export default function ProductDetailClient({ product }) {
  const { addItem } = useCart();
  const { currency } = useCurrency();
  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState(product.variants[0]?.color || '');
  const currentVariant = product.variants.find((v) => v.color === color);
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const touchStartX = useRef(null);
  const addLocked = useRef(false);
  const confirmationRef = useRef(null);
  useEffect(() => {
    if (added) confirmationRef.current?.showModal();
    else confirmationRef.current?.close();
  }, [added]);

  // Authoritative price for the selected variant — falls back to the
  // product's base price only when this variant has no override.
  const unitPrice = currentVariant?.price ?? product.price;
  const totalPrice = unitPrice * quantity;
  const gallery = currentVariant?.images?.length
    ? currentVariant.images
    : product.gallery?.length
      ? product.gallery
      : [product.image];

  const sizeGuides = currentVariant?.sizeGuides || [];

  function handleColorChange(newColor) {
    setColor(newColor);
    setSize('');
    setActiveImage(0);
  }

  function goTo(delta) {
    setActiveImage((i) => (i + delta + gallery.length) % gallery.length);
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 40) goTo(deltaX < 0 ? 1 : -1);
    touchStartX.current = null;
  }

  function handleAddToCart() {
    if (addLocked.current || !currentVariant || !size ||
        !currentVariant.sizes.includes(size) ||
        (currentVariant.outOfStockSizes || []).includes(size)) return;
    addLocked.current = true;
    addItem({ productSlug: product.id, name: product.name, image: product.image,
      price: unitPrice, color, size, quantity });
    setAdded(true);
    setColor(product.variants[0]?.color || '');
    setSize('');
    setQuantity(1);
    setActiveImage(0);
    setSizeGuideOpen(false);
    setDetailsOpen(false);
    setShippingOpen(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <dialog ref={confirmationRef} onCancel={() => setAdded(false)} onClose={() => setAdded(false)} aria-labelledby="cart-confirmation-title" className="w-[calc(100%-2rem)] max-w-sm border border-rule bg-canvas p-6 text-ink backdrop:bg-black/40">
        <Check size={28} className="mx-auto" />
        <h2 id="cart-confirmation-title" className="mt-4 text-center font-display text-xl">Added to cart</h2>
        <p className="mt-3 text-center text-sm text-ink-fog">Your item is in your cart. Complete checkout to place your order.</p>
        <Link href="/cart" className="mt-6 block rounded-full bg-ink px-5 py-3 text-center text-sm text-canvas">View cart</Link>
        <button autoFocus onClick={() => setAdded(false)} className="mt-3 w-full rounded-full border border-rule px-5 py-3 text-sm">Continue shopping</button>
      </dialog>
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        {/* GALLERY */}
        <div>
          <div
            className="reticle relative aspect-[4/5] w-full touch-pan-y overflow-hidden bg-canvas-alt text-ink"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={gallery[activeImage]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            {gallery.length > 1 && (
              <>
                <button
                  onClick={() => goTo(-1)}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-canvas/80 p-2 text-ink md:block"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => goTo(1)}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-canvas/80 p-2 text-ink md:block"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden">
                  {gallery.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${i === activeImage ? 'bg-ink' : 'bg-ink/30'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 hidden gap-3 md:flex">
              {gallery.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setActiveImage(i)}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden border transition-colors ${
                    activeImage === i ? 'border-ink' : 'border-rule hover:border-ink-fog'
                  }`}
                  aria-label={`Show image ${i + 1}`}
                >
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-fog">
            {product.collection} · {product.category}
            {product.authenticityTag && ` · ${product.authenticityTag}`}
          </span>
          <h1 className="mt-2 font-display text-3xl font-medium leading-tight tracking-tight text-ink md:text-4xl">
            {product.name}
          </h1>

          <p className="mt-4 font-mono text-xl text-ink">{formatPrice(unitPrice, currency)}</p>

          <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-fog">{product.description}</p>

          {/* COLOR */}
          {product.variants?.length > 0 && (
            <div className="mt-8">
              <p className="text-xs uppercase tracking-wide text-ink-fog">Color</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.color}
                    onClick={() => handleColorChange(v.color)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      color === v.color
                        ? 'border-ink bg-ink text-canvas'
                        : 'border-rule text-ink hover:border-ink-fog'
                    }`}
                  >
                    {v.color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SIZE */}
          {currentVariant?.sizes?.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-ink-fog">Size</p>
                {sizeGuides.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-ink-fog hover:text-ink"
                  >
                    <Ruler size={13} />
                    Size Guide
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentVariant.sizes.map((s) => {
                  const isOutOfStock = (currentVariant.outOfStockSizes || []).includes(s);

                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => { if (!isOutOfStock) { setSize(s); addLocked.current = false; } }}
                      className={`border px-4 py-2 text-sm transition-colors ${
                        isOutOfStock
                          ? "cursor-not-allowed border-rule text-ink-fog line-through opacity-50"
                          : size === s
                            ? "border-ink bg-ink text-canvas"
                            : "border-rule text-ink hover:border-ink-fog"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}              </div>
              {sizeGuides.length > 0 && sizeGuideOpen && (
                <div className="mt-3 animate-rise">
                  <SizeGuideTable sizeGuide={sizeGuides[0]} />
                </div>
              )}
            </div>
          )}

          {/* QUANTITY */}
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wide text-ink-fog">Quantity</p>
            <div className="mt-3 flex w-fit items-center gap-4 rounded-full border border-rule px-2 py-1.5">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-1.5 text-ink hover:text-ink-fog"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="w-6 text-center font-mono text-ink">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="p-1.5 text-ink hover:text-ink-fog"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* WAREHOUSE */}
          <div className="mt-8 flex items-center gap-3 border border-rule px-4 py-3">
            <Truck size={18} className="shrink-0 text-ink-fog" />
            <p className="text-sm text-ink">Free warehouse storage: 7 days for one paid order, 30 days for customers with two or more paid orders.</p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={added || !size || !currentVariant || (currentVariant.outOfStockSizes || []).includes(size)}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-sm font-medium text-canvas transition-transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed md:w-auto md:px-10"
          >
            {added ? (
              <>
                <Check size={16} /> Added to Cart
              </>
            ) : (
              size ? `Add to Cart — ${formatPrice(totalPrice, currency)}` : 'Choose a size to add to cart'
            )}
          </button>

          {/* PRODUCT DETAILS / SHIPPING & RETURNS */}
          <div className="mt-10 divide-y divide-rule border-t border-b border-rule">
            <div>
              <button
                onClick={() => setDetailsOpen((v) => !v)}
                className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-ink"
              >
                Product Details
                <Plus size={16} className={`text-ink-fog transition-transform ${detailsOpen ? 'rotate-45' : ''}`} />
              </button>
              {detailsOpen && (
                <p className="pb-4 text-sm leading-relaxed text-ink-fog">
                  {product.longDescription || product.description}
                </p>
              )}
            </div>
            <div>
              <button
                onClick={() => setShippingOpen((v) => !v)}
                className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-ink"
              >
                Shipping &amp; Returns
                <Plus size={16} className={`text-ink-fog transition-transform ${shippingOpen ? 'rotate-45' : ''}`} />
              </button>
              {shippingOpen && (
                <div className="space-y-2 pb-4 text-sm leading-relaxed text-ink-fog">
                  <p>
                    You pay for the product now. Once it arrives at our warehouse, it's stored
                    free for 7 days, or 30 days with two or more paid orders, while you decide when to ship — combine it with other pieces
                    into one shipment any time, and pay shipping separately then.
                  </p>
                  <p>Collect at Chevron, Lagos after your items arrive in Nigeria. Local delivery can be requested on WhatsApp after arrival, at a separately agreed cost.</p>
                  <p>
                    Track every step from your account under{' '}
                    <Link href="/account/orders" className="text-ink underline underline-offset-2">
                      My Orders
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
