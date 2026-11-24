'use server';

import { createClient } from '../supabase/server';
import { logServerError } from '../server-error';
import { createServiceRoleClient } from '../supabase/serviceRole';
import { applyStoragePolicy } from '../storagePolicy';

export async function getMyOrders() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    logServerError('account.get_orders', error);
    return [];
  }
  return data;
}

export async function getMyOrderByNumber(orderNumber) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (error) {
    logServerError('account.get_order_by_number', error);
    return null;
  }
  return data;
}

export async function getWarehouseItemForOrder(orderId) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  await applyStoragePolicy(createServiceRoleClient(), user.id);
  const { data, error } = await supabase
    .from('warehouse_items')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) return null;
  return data;
}
