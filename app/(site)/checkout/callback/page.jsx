import { redirect } from 'next/navigation';
import Link from 'next/link';
import { confirmOrderPayment } from '@/lib/account/paymentVerification';

export default async function CheckoutCallbackPage({ searchParams }) {
  const reference = searchParams?.reference || searchParams?.trxref;

  if (!reference) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="font-display text-2xl text-ink">Missing payment reference.</h1>
        <Link href="/shop" className="mt-6 inline-block text-ink hover:underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const result = await confirmOrderPayment(reference);

  if (!result.success) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-fog">Payment issue</p>
        <h1 className="mt-3 font-display text-2xl text-ink">We couldn't confirm this payment.</h1>
        <p className="mt-3 text-ink-fog">{result.error}</p>
        <p className="mt-3 text-sm text-ink-fog">
          If you were actually charged, contact us from the{' '}
          <Link href="/contact" className="text-ink hover:underline">contact page</Link> with your
          reference: <span className="font-mono">{reference}</span>
        </p>
      </div>
    );
  }

  redirect(`/checkout/confirmation?ref=${encodeURIComponent(reference)}`);
}
