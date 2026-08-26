import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminLoginPage = path === '/admin/login';
  const isAdminPage = path.startsWith('/admin');
  const isAdminApi = path.startsWith('/api/admin');

  const isCustomerAuthPage = path === '/login' || path === '/signup';
  const isAccountPage = path.startsWith('/account');
  const isCheckoutPage = path.startsWith('/checkout');

  let isAdmin = false;
  if (user && (isAdminPage || isAdminApi)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    isAdmin = profile?.role === 'admin';
  }

  if (isAdminApi && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isAdminPage && !isAdminLoginPage && !isAdmin) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (isAdminLoginPage && isAdmin) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if ((isAccountPage || isCheckoutPage) && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (isCustomerAuthPage && user) {
    return NextResponse.redirect(new URL('/account', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/account/:path*', '/checkout/:path*', '/login', '/signup'],
};
