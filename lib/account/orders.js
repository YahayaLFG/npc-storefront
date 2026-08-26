'use server';

import { createClient } from '../supabase/server';

export async function getMyOrders() {
  const supabase = createClient();
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
    console.error('getMyOrders error:', error.message);
    return [];
  }
  return data;
}

export async function getMyOrderByNumber(orderNumber) {
  const supabase = createClient();
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
    console.error('getMyOrderByNumber error:', error.message);
    return null;
  }
  return data;
}

export async function getWarehouseItemForOrder(orderId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('warehouse_items')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) return null;
  return data;
}
