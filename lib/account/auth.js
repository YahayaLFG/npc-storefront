'use server';

import { createClient } from '../supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { publicError } from '../server-error';

function safeRedirect(path) {
  if (typeof path === 'string' && path.startsWith('/')) {
    try {
      const target = new URL(path, 'https://npc-local.invalid');
      if (target.origin === 'https://npc-local.invalid') {
        return `${target.pathname}${target.search}${target.hash}`;
      }
    } catch {
      // Fall through to the account home for malformed destinations.
    }
  }
  return '/account';
}

function normalizeOrigin(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.origin : null;
  } catch {
    return null;
  }
}

async function getAppOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
  if (host && /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)) {
    const protocol = requestHeaders.get('x-forwarded-proto') || 'http';
    return normalizeOrigin(`${protocol}://${host}`);
  }

  const configuredOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const netlifyOrigin = normalizeOrigin(process.env.URL);
  const vercelProductionOrigin = normalizeOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  );
  const vercelOrigin = normalizeOrigin(
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`
  );

  // Netlify exposes its canonical site URL as URL. On Vercel production,
  // prefer the configured public URL over VERCEL_URL, which can be a
  // deployment-specific hostname that is not in Supabase's redirect allowlist.
  if (process.env.NETLIFY && netlifyOrigin) return netlifyOrigin;
  if (process.env.VERCEL_ENV === 'production') {
    return configuredOrigin || vercelProductionOrigin || vercelOrigin || netlifyOrigin || 'http://localhost:3000';
  }

  return netlifyOrigin || vercelOrigin || configuredOrigin || 'http://localhost:3000';
}

async function getConfirmationRedirect() {
  return `${await getAppOrigin()}/auth/callback`;
}

export async function signup({ email, password, fullName, redirectTo }) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { full_name: fullName?.trim() || '' },
      emailRedirectTo: await getConfirmationRedirect(),
    },
  });

  if (error) {
    return publicError('account.signup', error, 'We could not create your account. Please try again.');
  }

  if (data.session) redirect(safeRedirect(redirectTo));

  return { confirmationRequired: true, email: email.trim().toLowerCase() };
}

export async function resendSignupConfirmation(email) {
  const supabase = await createClient();
  const normalizedEmail = email.trim().toLowerCase();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizedEmail,
    options: { emailRedirectTo: await getConfirmationRedirect() },
  });

  if (error) return publicError('account.resend_confirmation', error, 'We could not resend the email. Please try again.');
  return { sent: true };
}

export async function login({ email, password, redirectTo }) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return publicError('account.login', error, 'We could not sign you in. Check your details and try again.');
  }

  redirect(safeRedirect(redirectTo));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
