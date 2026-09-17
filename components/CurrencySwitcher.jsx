'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCurrency } from './CurrencyContext';

const OPTIONS = [
  { value: 'NGN', label: 'NGN ₦' },
  { value: 'USD', label: 'USD $' },
];

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const activeLabel = OPTIONS.find((o) => o.value === currency)?.label || 'NGN ₦';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 font-mono text-xs tracking-wide text-ink hover:text-ink-fog"
      >
        {activeLabel}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-28 border border-rule bg-canvas shadow-sm">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                setCurrency(o.value);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left font-mono text-xs ${
                currency === o.value ? 'bg-canvas-alt text-ink' : 'text-ink-fog hover:text-ink'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
