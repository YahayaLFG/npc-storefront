import { createClient } from '@/lib/supabase/server';
import { CartProvider } from '@/components/CartContext';
import { CurrencyProvider } from '@/components/CurrencyContext';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import Marquee from '@/components/Marquee';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default async function SiteLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <CartProvider>
      <CurrencyProvider>
        <div className="flex min-h-screen flex-col bg-canvas text-ink">
          <div className="border-b border-rule px-5 py-2 md:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <span className="font-display text-sm font-extrabold tracking-tightest text-ink">NPC®</span>
              <CurrencySwitcher />
            </div>
          </div>
          <Marquee />
          <Header user={user} />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </CurrencyProvider>
    </CartProvider>
  );
}
