'use server';

import { createClient } from '../supabase/server';
import { redirect } from 'next/navigation';

export async function login({ email, password }) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect('/admin');
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
