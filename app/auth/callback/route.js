import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const tokenType = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/account';

  const fail = () => NextResponse.redirect(new URL('/login?error=auth_callback', requestUrl.origin));
  if (!code && !tokenHash) {
    return fail();
  }

  const supabase = await createClient();
  const allowedOtpTypes = ['signup', 'email', 'invite', 'magiclink', 'recovery', 'email_change'];
  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : allowedOtpTypes.includes(tokenType)
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tokenType })
      : { error: new Error('Invalid verification link.') };

  if (result.error) return fail();

  let safeNext = '/account';
  if (next.startsWith('/')) {
    try {
      const target = new URL(next, requestUrl.origin);
      if (target.origin === requestUrl.origin) {
        safeNext = `${target.pathname}${target.search}${target.hash}`;
      }
    } catch {
      // Keep the default destination if the callback URL is malformed.
    }
  }
  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
