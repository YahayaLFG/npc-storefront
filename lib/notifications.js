'use server';

import { createServiceRoleClient } from './supabase/serviceRole';
import { createClient } from './supabase/server';
import { sendEmailNotification } from './notifications/email';

/**
 * Creates a dashboard notification for a customer, and fires an email
 * alongside it (no-ops gracefully if email isn't configured). Called from
 * admin actions AND the Paystack webhook (which has no customer session
 * at all) — so this always uses the service-role client rather than
 * relying on RLS + a caller's session.
 */
export async function notifyCustomer({ customerId, type = 'order_status', title, message, orderId }) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from('notifications').insert({
    customer_id: customerId,
    type,
    title,
    message,
    related_order_id: orderId || null,
  });
  if (error) {
    console.error('notifyCustomer insert failed:', error.message);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', customerId)
    .maybeSingle();

  if (profile?.email) {
    await sendEmailNotification({ to: profile.email, subject: title, body: message });
  }
}

/** Fetches recent notifications for the current customer's dashboard/bell. */
export async function getMyNotifications() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error('getMyNotifications error:', error.message);
    return [];
  }
  return data;
}

export async function markNotificationRead(id) {
  const supabase = createClient();
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}
