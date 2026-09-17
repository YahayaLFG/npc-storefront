'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const CurrencyContext = createContext(null);
const STORAGE_KEY = 'npc_currency'; // deliberately separate from npc_cart — switching currency must never touch the cart

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('NGN');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'NGN' || saved === 'USD') setCurrency(saved);
    } catch {
      // Inaccessible storage — just stay on the NGN default for this session.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      // Ignore — preference just won't persist this session.
    }
  }, [currency, hydrated]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
