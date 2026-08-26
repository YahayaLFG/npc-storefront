import crypto from 'crypto';

/**
 * Server-only Paystack wrapper. PAYSTACK_SECRET_KEY must never be exposed
 * to the browser — every function here runs in a Server Action or Route
 * Handler, never in a 'use client' file.
 */

const PAYSTACK_BASE = 'https://api.paystack.co';

function requireSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error(
      'PAYSTACK_SECRET_KEY is not set. Add it to your environment before accepting payments.'
    );
  }
  return key;
}

/**
 * Starts a Paystack transaction and returns the hosted checkout URL to
 * redirect the customer to.
 */
export async function initializePaystackTransaction({ email, amountNgn, reference, callbackUrl, metadata }) {
  const secretKey = requireSecretKey();

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amountNgn * 100), // Paystack expects kobo
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || 'Could not start payment with Paystack.');
  }
  return data.data; // { authorization_url, access_code, reference }
}

/**
 * Verifies a transaction by reference. ALWAYS call this server-side before
 * treating a payment as successful — never trust a client-side redirect
 * alone, since that URL could be visited/spoofed without a real payment.
 */
export async function verifyPaystackTransaction(reference) {
  const secretKey = requireSecretKey();

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || 'Could not verify payment with Paystack.');
  }
  return data.data; // { status: 'success'|'failed'|..., amount, reference, metadata, ... }
}

/**
 * Verifies that a webhook request actually came from Paystack, by
 * recomputing the HMAC-SHA512 signature over the raw request body using
 * the secret key and comparing it to the x-paystack-signature header.
 */
export function verifyPaystackWebhookSignature(rawBody, signatureHeader) {
  if (!signatureHeader) return false;
  const secretKey = requireSecretKey();
  const expected = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
  return expected === signatureHeader;
}
