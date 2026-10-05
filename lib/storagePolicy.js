// Paid orders qualify across checkouts, including multiple items in one checkout.
export async function applyStoragePolicy(supabase, customerId) {
  const { count, error } = await supabase.from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId).not('paid_at', 'is', null);
  if (error) throw new Error(error.message);
  const freeStorageDays = count >= 2 ? 30 : 7;
  if (freeStorageDays === 30) {
    const { error: updateError } = await supabase.from('warehouse_items')
      .update({ free_storage_days: 30 }).eq('customer_id', customerId)
      .is('shipment_id', null).lt('free_storage_days', 30);
    if (updateError) throw new Error(updateError.message);
  }
  return freeStorageDays;
}
