import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 *
 * ⚠️ Only use this where there is genuinely no user session to work with,
 * like the Paystack webhook (Paystack's servers call it directly — there's
 * no customer cookie to authenticate with). Never use this for anything
 * triggered by a request you haven't independently verified, since it has
 * no access restrictions of its own.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY — find it in Supabase under
 * Project Settings → API → service_role (the secret one, not anon).
 * Never prefix this with NEXT_PUBLIC_ or it would ship to the browser.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. The Paystack webhook needs it to update orders without a customer session.'
    );
  }

  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
