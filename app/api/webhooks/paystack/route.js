import { NextResponse } from 'next/server';
import { verifyPaystackWebhookSignature } from '@/lib/paystack';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { confirmOrderPayment, confirmShipmentPayment } from '@/lib/account/paymentVerification';
import { logServerError, publicError } from '@/lib/server-error';

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get('paystack-signature');
  const legacySignature = request.headers.get('x-paystack-signature');

  let validSignature = false;
  try {
    validSignature = verifyPaystackWebhookSignature(rawBody, { signature, legacySignature });
  } catch (err) {
    return NextResponse.json(publicError('paystack.webhook_signature', err, 'Payment processing is temporarily unavailable.'), { status: 500 });
  }

  if (!validSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference;
  const kind = event.data?.metadata?.kind;
  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }
  if (kind !== 'shipping' && kind !== 'product_batch') {
    return NextResponse.json({ error: 'Unsupported payment type' }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();

  try {
    const result = kind === 'shipping'
      ? await confirmShipmentPayment(reference, serviceClient)
      : await confirmOrderPayment(reference, serviceClient);
    if (!result.success) {
      const failure = publicError('paystack.webhook_confirmation', result.error, 'Payment confirmation is temporarily unavailable.');
      return NextResponse.json(failure, { status: 500 });
    }
  } catch (err) {
    const errorId = logServerError('paystack.webhook_processing', err);
    return NextResponse.json({ error: 'Payment processing is temporarily unavailable.', errorId }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
