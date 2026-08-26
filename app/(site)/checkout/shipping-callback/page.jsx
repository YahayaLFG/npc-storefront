import { redirect } from 'next/navigation';
import Link from 'next/link';
import { confirmShipmentPayment } from '@/lib/account/paymentVerification';

export default async function ShippingCallbackPage({ searchParams }) {
  const reference = searchParams?.reference || searchParams?.trxref;

  if (!reference) {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <h1 className="font-display text-2xl text-ink">Missing payment reference.</h1>
        <Link href="/account/orders" className="mt-6 inline-block text-ink hover:underline">
          Back to my orders
        </Link>
      </div>
    );
  }

  const result = await confirmShipmentPayment(reference);

  if (result.success && result.shipmentId) {
    redirect(`/account/shipments/${result.shipmentId}?confirmed=1`);
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-fog">Payment issue</p>
      <h1 className="mt-3 font-display text-2xl text-ink">We couldn't confirm this payment.</h1>
      <p className="mt-3 text-ink-fog">{result.error}</p>
      <Link href="/account/warehouse" className="mt-6 inline-block text-ink hover:underline">
        Back to my warehouse
      </Link>
    </div>
  );
}
