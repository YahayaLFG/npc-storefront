import DeliveryCalculator from './DeliveryCalculator';
import { buildWhatsAppLink } from '@/lib/whatsapp';

export const metadata = { title: 'Freight & Pickup — NPC' };

export default function DeliveryPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">Freight &amp; Pickup</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">Collect when your items arrive</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink-fog">
        <p>Pay for your products at checkout. Freight to Nigeria is billed separately once your shipment is ready, based on its actual chargeable weight.</p>
        <p>Once your items arrive in Nigeria, you can collect them at Chevron, Lagos. Exact collection details will be shared when ready.</p>
        <p>Need local delivery instead? Request it on WhatsApp after your items arrive. We will confirm availability and agree the delivery cost with you separately.</p>
      </div>
      <a href={buildWhatsAppLink('Hey NPC, my items have arrived in Nigeria. I would like to request local delivery.')} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-sm text-canvas">Request delivery on WhatsApp</a>
      <div className="mt-10"><DeliveryCalculator /></div>
    </div>
  );
}
