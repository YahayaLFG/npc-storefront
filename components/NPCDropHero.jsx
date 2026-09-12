'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function NPCDropHero({ products = [] }) {
  const [entered, setEntered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(null);

  const items = products.filter((product) => product?.image);

  const activeProduct = items[activeIndex];

  function next() {
    if (!items.length) return;
    setActiveIndex((current) => (current + 1) % items.length);
  }

  function previous() {
    if (!items.length) return;
    setActiveIndex((current) => (current - 1 + items.length) % items.length);
  }

  function handleKeyDown(event) {
    if (!entered) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next();
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      previous();
    }

    if (event.key === 'Escape') {
      setEntered(false);
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  function handleTouchStart(event) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event) {
    if (touchStartX.current === null) return;

    const deltaX = event.changedTouches[0].clientX - touchStartX.current;

    if (Math.abs(deltaX) > 45) {
      if (deltaX < 0) {
        next();
      } else {
        previous();
      }
    }

    touchStartX.current = null;
  }

  if (!items.length) {
    return (
      <section className="mx-auto max-w-6xl px-5 pt-6 md:px-8 md:pt-8">
        <div className="flex min-h-[70vh] items-center justify-center border border-rule bg-canvas-alt text-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-ink-fog">
              NPC®
            </p>
            <p className="mt-4 font-display text-3xl tracking-tight text-ink">
              Offline before everyone else.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!entered) {
    return (
      <section className="mx-auto max-w-6xl px-5 pt-6 md:px-8 md:pt-8">
        <button
          type="button"
          onClick={() => setEntered(true)}
          className="group relative flex min-h-[72vh] w-full items-center justify-center overflow-hidden border border-rule bg-canvas-alt text-left"
          aria-label="Enter the NPC drop"
        >
          <div className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={items[0].image}
              alt=""
              className="h-full w-full object-cover opacity-20 grayscale transition-transform duration-[1400ms] group-hover:scale-105"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center px-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-ink-fog">
              NPC®
            </p>

            <h1 className="mt-6 max-w-2xl font-display text-4xl font-medium leading-none tracking-[-0.04em] text-ink md:text-7xl">
              Offline before
              <br />
              everyone else.
            </h1>

            <div className="mt-12 flex items-center gap-3">
              <span className="rounded-full bg-ink px-6 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-canvas transition-transform duration-300 group-hover:scale-105">
                Enter the drop
              </span>

              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ink text-sm text-ink transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </div>
          </div>

          <div className="absolute bottom-5 left-5 font-mono text-[9px] uppercase tracking-[0.25em] text-ink-fog">
            Curated for people who get it
          </div>

          <div className="absolute bottom-5 right-5 font-mono text-[9px] uppercase tracking-[0.25em] text-ink-fog">
            001 / {String(items.length).padStart(3, '0')}
          </div>
        </button>
      </section>
    );
  }

  const variants = activeProduct?.variants || [];
  const activeVariant = variants[0];
  const availableSizes = activeVariant?.sizes || [];
  const outOfStockSizes = activeVariant?.outOfStockSizes || [];

  return (
    <section className="mx-auto max-w-6xl px-5 pt-6 md:px-8 md:pt-8">
      <div
        className="relative min-h-[72vh] overflow-hidden border border-rule bg-canvas-alt"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeProduct.id}
            src={activeProduct.image}
            alt=""
            className="h-full w-full object-cover transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="absolute left-5 top-5 z-10 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.25em] text-white md:left-7 md:top-7">
          <span>NPC®</span>
          <span className="opacity-60">/</span>
          <span>
            {String(activeIndex + 1).padStart(2, '0')} /{' '}
            {String(items.length).padStart(2, '0')}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setEntered(false)}
          className="absolute right-5 top-5 z-10 font-mono text-[9px] uppercase tracking-[0.25em] text-white opacity-80 transition-opacity hover:opacity-100 md:right-7 md:top-7"
        >
          Exit
        </button>

        <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col justify-between gap-8 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-5 pb-6 pt-32 text-white md:flex-row md:items-end md:px-7 md:pb-7">
          <div className="max-w-xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] opacity-70">
              Current drop
            </p>

            <h2 className="mt-2 font-display text-3xl font-medium leading-tight tracking-[-0.03em] md:text-5xl">
              {activeProduct.name}
            </h2>

            {activeVariant?.color && (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] opacity-80">
                {activeVariant.color}
              </p>
            )}

            {availableSizes.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const soldOut = outOfStockSizes.includes(size);

                  return (
                    <span
                      key={size}
                      className={`border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.15em] ${
                        soldOut
                          ? 'border-white/30 text-white/40 line-through'
                          : 'border-white/70 text-white'
                      }`}
                    >
                      {size}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href={`/product/${activeProduct.id}`}
            className="inline-flex w-fit items-center gap-3 border border-white px-5 py-3 font-mono text-[9px] uppercase tracking-[0.25em] text-white transition-colors hover:bg-white hover:text-black"
          >
            View piece
            <span>→</span>
          </Link>
        </div>

        <div className="absolute bottom-6 right-5 z-20 hidden gap-2 md:flex">
          <button
            type="button"
            onClick={previous}
            className="flex h-10 w-10 items-center justify-center border border-white/60 text-white transition-colors hover:bg-white hover:text-black"
            aria-label="Previous piece"
          >
            ←
          </button>

          <button
            type="button"
            onClick={next}
            className="flex h-10 w-10 items-center justify-center border border-white/60 text-white transition-colors hover:bg-white hover:text-black"
            aria-label="Next piece"
          >
            →
          </button>
        </div>

        <div className="absolute bottom-5 left-5 z-20 font-mono text-[9px] uppercase tracking-[0.25em] text-white/70 md:bottom-7">
          Swipe / scroll to explore
        </div>
      </div>
    </section>
  );
}