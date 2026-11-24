'use server';

import { createClient } from '../supabase/server';
import { redirect } from 'next/navigation';
import { publicError } from '../server-error';

export async function login({ email, password }) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return publicError('admin.login', error, 'We could not sign you in. Check your details and try again.');
  }

  redirect('/admin');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
