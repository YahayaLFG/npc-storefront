'use server';

import { createClient } from '../supabase/server';
import { redirect } from 'next/navigation';

function safeRedirect(path) {
  if (path && path.startsWith('/') && !path.startsWith('//')) return path;
  return '/account';
}

export async function signup({ email, password, fullName, redirectTo }) {
  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || '' },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(safeRedirect(redirectTo));
}

export async function login({ email, password, redirectTo }) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(safeRedirect(redirectTo));
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
