import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for use inside 'use client' components — the admin
 * dashboard forms, image uploads, and login page all use this.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
