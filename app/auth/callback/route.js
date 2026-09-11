import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/account';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth_callback', requestUrl.origin));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/login?error=auth_callback', requestUrl.origin));
  }

  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/account';
  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
