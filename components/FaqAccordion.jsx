'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="divide-y divide-rule border-t border-b border-rule">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-display text-base md:text-lg">{item.q}</span>
              <Plus
                size={18}
                className={`shrink-0 text-ink transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
              />
            </button>
            <div
              className={`grid overflow-hidden transition-all duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <p className="overflow-hidden text-sm leading-relaxed text-ink-fog">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
