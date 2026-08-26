'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, User, ShoppingBag } from 'lucide-react';
import NavOverlay from './NavOverlay';
import SearchOverlay from './SearchOverlay';
import CartOverlay from './CartOverlay';
import NotificationBell from './NotificationBell';
import { useCart } from './CartContext';

export default function Header({ user }) {
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { totalCount } = useCart();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-rule bg-canvas/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center px-5 py-5 md:px-8">
          <button
            onClick={() => setNavOpen(true)}
            className="flex items-center gap-2 text-ink"
            aria-label="Open menu"
          >
            <Menu size={22} />
            <span className="hidden text-sm tracking-wide sm:inline">Menu</span>
          </button>

          <a
            href="/"
            className="justify-self-center font-display text-2xl font-extrabold tracking-tightest text-ink"
          >
            NPC
          </a>

          <div className="flex items-center gap-5 justify-self-end text-ink">
            <button onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search size={20} />
            </button>
            {user && <NotificationBell />}
            <button onClick={() => setCartOpen(true)} aria-label="Cart" className="relative">
              <ShoppingBag size={20} />
              {totalCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 font-mono text-[9px] text-canvas">
                  {totalCount > 9 ? '9+' : totalCount}
                </span>
              )}
            </button>
            <Link href={user ? '/account' : '/login'} aria-label="My account">
              <User size={20} />
            </Link>
          </div>
        </div>
      </header>

      <NavOverlay open={navOpen} onClose={() => setNavOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartOverlay open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
