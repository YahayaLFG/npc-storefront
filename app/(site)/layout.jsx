import { createClient } from '@/lib/supabase/server';
import { CartProvider } from '@/components/CartContext';
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
      <div className="flex min-h-screen flex-col bg-canvas text-ink">
        <Marquee />
        <Header user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </CartProvider>
  );
}
