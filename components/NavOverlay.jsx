'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { COLLECTIONS, NAV_STRUCTURE } from '@/lib/taxonomy';

export default function NavOverlay({ open, onClose }) {
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!open) setExpanded(null);
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-bone">
      <div className="flex items-center justify-between border-b border-line px-5 py-5 md:px-8">
        <span className="font-display text-xl font-extrabold tracking-tightest">NPC</span>
        <button onClick={onClose} aria-label="Close menu">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 md:px-8">
        <a
          href="/shop"
          onClick={onClose}
          className="block border-b border-line py-4 font-display text-2xl tracking-tight md:text-3xl"
        >
          Shop All
        </a>

        {COLLECTIONS.map((collection) => {
          const isExpanded = expanded === collection;
          return (
            <div key={collection} className="border-b border-line">
              <button
                onClick={() => setExpanded(isExpanded ? null : collection)}
                className="flex w-full items-center justify-between py-4 text-left font-display text-2xl tracking-tight md:text-3xl"
              >
                {collection}
                <ChevronDown
                  size={20}
                  className={`text-fog transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {isExpanded && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 pb-5 md:grid-cols-3">
                  <a
                    href={`/shop?collection=${encodeURIComponent(collection)}`}
                    onClick={onClose}
                    className="py-2 text-sm text-fog hover:text-bone"
                  >
                    All {collection}
                  </a>
                  {NAV_STRUCTURE[collection].map((category) => (
                    <a
                      key={category}
                      href={`/shop?collection=${encodeURIComponent(collection)}&category=${encodeURIComponent(category)}`}
                      onClick={onClose}
                      className="py-2 text-sm text-fog hover:text-bone"
                    >
                      {category}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-8 flex flex-col gap-1 text-sm text-fog">
          <a href="/request" onClick={onClose} className="py-2 hover:text-bone">Request a Piece</a>
          <a href="/faq" onClick={onClose} className="py-2 hover:text-bone">FAQ</a>
          <a href="/contact" onClick={onClose} className="py-2 hover:text-bone">Contact</a>
        </div>
      </div>
    </div>
  );
}
