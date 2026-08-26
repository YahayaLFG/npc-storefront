'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { formatNGN } from '@/lib/format';

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-bone">
      <div className="flex items-center gap-4 border-b border-line px-5 py-5 md:px-8">
        <Search size={20} className="shrink-0 text-fog" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, categories, colors…"
          className="w-full bg-transparent font-display text-xl placeholder:text-mute focus:outline-none md:text-2xl"
        />
        <button onClick={onClose} aria-label="Close search" className="shrink-0">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 md:px-8">
        {loading && <p className="text-sm text-mute">Searching…</p>}

        {!loading && query.trim() && results.length === 0 && (
          <p className="text-sm text-mute">Nothing matches "{query}".</p>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-8">
          {results.map((product) => (
            <a key={product.id} href={`/product/${product.id}`} onClick={onClose} className="group flex flex-col">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-panel">
                {product.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                )}
              </div>
              <div className="mt-3 flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-mute">
                  {product.category}
                </span>
                <h3 className="text-sm text-bone">{product.name}</h3>
                <span className="font-mono text-xs text-fog">{formatNGN(product.price)}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
