'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'npc_cart';

function lineKey(item) {
  return `${item.productSlug}:${item.color}:${item.size}`;
}

// Missing `selected` (old carts saved before this feature existed) is
// always treated as selected — never as deselected. Nothing ever writes
// `selected: false` implicitly; it only becomes false if the customer
// explicitly unchecks something.
function isSelected(item) {
  return item.selected !== false;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Corrupt or inaccessible storage — start empty rather than breaking the page.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage failures — cart still works in-memory for this session.
    }
  }, [items, hydrated]);

  const addItem = useCallback((newItem) => {
    setItems((prev) => {
      const key = lineKey(newItem);
      const existing = prev.find((i) => lineKey(i) === key);
      if (existing) {
        return prev.map((i) =>
          lineKey(i) === key ? { ...i, quantity: i.quantity + newItem.quantity } : i
        );
      }
      // New lines default to selected — matches how an old cart with no
      // `selected` key at all is already treated everywhere else.
      return [...prev, { ...newItem, selected: true }];
    });
  }, []);

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((i) => lineKey(i) !== key));
  }, []);

  const updateQuantity = useCallback((key, quantity) => {
    setItems((prev) =>
      prev.map((i) => (lineKey(i) === key ? { ...i, quantity: Math.max(1, quantity) } : i))
    );
  }, []);

  const toggleSelected = useCallback((key) => {
    setItems((prev) =>
      prev.map((i) => (lineKey(i) === key ? { ...i, selected: !isSelected(i) } : i))
    );
  }, []);

  const selectAll = useCallback(() => {
    setItems((prev) => prev.map((i) => ({ ...i, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setItems((prev) => prev.map((i) => ({ ...i, selected: false })));
  }, []);

  /**
   * Changes a line's color/size (from the cart-page edit panel). If the
   * new color+size already matches a DIFFERENT existing line, the two
   * merge (quantities combine, the edited line is removed) rather than
   * creating a second line with the same identity. Editing a line's own
   * unchanged color/size is a no-op merge into itself, handled the same
   * way without special-casing.
   */
  const updateItem = useCallback((oldKey, changes) => {
    setItems((prev) => {
      const target = prev.find((i) => lineKey(i) === oldKey);
      if (!target) return prev;

      const updated = { ...target, ...changes };
      const newKey = lineKey(updated);

      if (newKey === oldKey) {
        return prev.map((i) => (lineKey(i) === oldKey ? updated : i));
      }

      const collision = prev.find((i) => lineKey(i) !== oldKey && lineKey(i) === newKey);
      if (collision) {
        return prev
          .filter((i) => lineKey(i) !== oldKey)
          .map((i) =>
            lineKey(i) === newKey ? { ...i, quantity: i.quantity + updated.quantity } : i
          );
      }

      return prev.map((i) => (lineKey(i) === oldKey ? updated : i));
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const selectedItems = items.filter(isSelected);
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const selectedTotalPrice = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const selectedCount = selectedItems.reduce((sum, i) => sum + i.quantity, 0);
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateItem,
        toggleSelected,
        selectAll,
        deselectAll,
        clear,
        totalCount,
        totalPrice,
        selectedItems,
        selectedTotalPrice,
        selectedCount,
        allSelected,
        isSelected,
        hydrated,
        lineKey,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
