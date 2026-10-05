import CheckoutClient from '@/components/CheckoutClient';

export const metadata = { title: 'Checkout — NPC' };

export default async function CheckoutPage() {

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 md:px-8 md:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">Checkout</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
        Review your order
      </h1>
      <p className="mt-4 text-sm text-ink-fog">
        Pay for your products first, then freight to Nigeria when your shipment is ready.
        Collect at Chevron, Lagos after arrival, or request local delivery on WhatsApp at that point.
      </p>

      <div className="mt-10">
        <CheckoutClient />
      </div>
    </div>
  );
}
