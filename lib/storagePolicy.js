import 'server-only';

import { publicServerException } from './server-error';

// Paid orders qualify across checkouts, including multiple items in one checkout.
export async function applyStoragePolicy(supabase, customerId) {
  const { count, error } = await supabase.from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId).not('paid_at', 'is', null);
  if (error) throw publicServerException('storage_policy.count_paid_orders', error);
  const freeStorageDays = count >= 2 ? 30 : 7;
  if (freeStorageDays === 30) {
    const { error: updateError } = await supabase.from('warehouse_items')
      .update({ free_storage_days: 30 }).eq('customer_id', customerId)
      .is('shipment_id', null).lt('free_storage_days', 30);
    if (updateError) throw publicServerException('storage_policy.update_warehouse', updateError);
  }
  return freeStorageDays;
}
