import FaqAccordion from '@/components/FaqAccordion';

export const metadata = { title: 'FAQ — NPC' };

const FAQS = [
  {
    q: 'How does ordering work?',
    a: 'Pick a piece, choose your size and color, and tap "Add to Cart." You pay for the product through Paystack, and it goes straight into your account to track.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Once your item reaches our warehouse, it\'s stored free for 7 days while you decide when to ship. From the day you pay to ship, delivery takes about 10–15 days.',
  },
  {
    q: 'How do I pay?',
    a: 'Through Paystack, in two separate payments: the product first, then shipping separately once you\'re ready to ship from your warehouse — you can combine several items into one shipment to save on shipping.',
  },
  {
    q: "What if I can't find something I'm looking for?",
    a: 'Use the Request page. Drop a link or an image, tell us the size and color, and we\'ll come back with a price.',
  },
  {
    q: 'Is there a minimum order?',
    a: 'No. One piece or a full fit — track every order the same way from your account.',
  },
  {
    q: 'What if something arrives wrong?',
    a: 'Message us on WhatsApp with photos and we\'ll sort it out directly. Every order runs through a real person, never a bot.',
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">Questions</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
        Curated for people who get it
      </h1>
      <p className="mt-4 text-ink-fog">
        Still stuck? Reach us directly on the{' '}
        <a href="/contact" className="text-ink hover:underline">contact page</a>.
      </p>

      <div className="mt-10">
        <FaqAccordion items={FAQS} />
      </div>
    </div>
  );
}
