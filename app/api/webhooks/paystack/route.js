import { NextResponse } from 'next/server';
import { verifyPaystackWebhookSignature } from '@/lib/paystack';
import { createServiceRoleClient } from '@/lib/supabase/serviceRole';
import { confirmOrderPayment, confirmShipmentPayment } from '@/lib/account/paymentVerification';

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  let validSignature = false;
  try {
    validSignature = verifyPaystackWebhookSignature(rawBody, signature);
  } catch (err) {
    console.error('Webhook signature check failed:', err.message);
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  if (!validSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference;
  const kind = event.data?.metadata?.kind;
  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }

  const serviceClient = createServiceRoleClient();

  try {
    if (kind === 'shipping') {
      await confirmShipmentPayment(reference, serviceClient);
    } else {
      await confirmOrderPayment(reference, serviceClient);
    }
  } catch (err) {
    console.error('Webhook processing error:', err.message);
  }

  return NextResponse.json({ received: true });
}
