'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Truck, Minus, Plus, Ruler, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { formatNGN } from '@/lib/format';
import SizeGuideTable from './SizeGuideTable';
import { useCart } from './CartContext';

export default function ProductDetailClient({ product }) {
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState(product.variants[0]?.color || '');
  const currentVariant = product.variants.find((v) => v.color === color);
  const [size, setSize] = useState(currentVariant?.sizes[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const touchStartX = useRef(null);

  const totalPrice = product.price * quantity;
  const gallery = currentVariant?.images?.length
    ? currentVariant.images
    : product.gallery?.length
      ? product.gallery
      : [product.image];

  const sizeGuides = currentVariant?.sizeGuides || [];

  function handleColorChange(newColor) {
    setColor(newColor);
    const newVariant = product.variants.find((v) => v.color === newColor);
    const firstAvailableSize = newVariant?.sizes.find(
      (s) => !(newVariant.outOfStockSizes || []).includes(s)
    );
    setSize(firstAvailableSize || '');
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
  const isOutOfStock = (currentVariant?.outOfStockSizes || []).includes(size);

  if (isOutOfStock) {
    return;
  }

  addItem({
    productSlug: product.id,
    name: product.name,
    image: product.image,
    price: product.price,
    color,
    size,
    quantity,
  });
  setAdded(true);
  setTimeout(() => setAdded(false), 2000);
}

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8 md:py-14">
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

          <p className="mt-4 font-mono text-xl text-ink">{formatNGN(product.price)}</p>

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
                      onClick={() => !isOutOfStock && setSize(s)}
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
            <p className="text-sm text-ink">Stored free in your warehouse for 7 days once it arrives.</p>
          </div>

          <button
            onClick={handleAddToCart}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-sm font-medium text-canvas transition-transform hover:scale-[1.01] md:w-auto md:px-10"
          >
            {added ? (
              <>
                <Check size={16} /> Added to Cart
              </>
            ) : (
              `Add to Cart — ${formatNGN(totalPrice)}`
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
                    free for 7 days while you decide when to ship — combine it with other pieces
                    into one shipment any time, and pay shipping separately then.
                  </p>
                  <p>Estimated delivery once shipped is 10–15 days.</p>
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
