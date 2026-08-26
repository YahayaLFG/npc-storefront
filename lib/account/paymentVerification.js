'use server';

import { createClient } from '../supabase/server';
import { verifyPaystackTransaction } from '../paystack';
import { generateOrderNumber } from './orderNumber';
import { notifyCustomer } from '../notifications';

/**
 * Confirms a cart checkout payment by reference. Always re-verifies with
 * Paystack server-side first. A payment reference belongs to an
 * order_batches row (one payment can cover several cart items). On
 * success, every order in the batch gets its own order_number and moves
 * to 'pending_purchase' — independently trackable from here on.
 *
 * Idempotent via an atomic paid_at claim, so a race between the callback
 * page and the webhook can't double-process.
 */
export async function confirmOrderPayment(reference, supabaseOverride) {
  const supabase = supabaseOverride || createClient();

  let verified;
  try {
    verified = await verifyPaystackTransaction(reference);
  } catch (err) {
    return { success: false, error: err.message };
  }

  const { data: batch } = await supabase
    .from('order_batches')
    .select('*')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (!batch) {
    return { success: false, error: 'No order found for this payment reference.' };
  }

  if (verified.status !== 'success') {
    return { success: false, error: 'Payment was not successful.' };
  }

  if (batch.paid_at) {
    const { data: existingOrders } = await supabase
      .from('orders')
      .select('order_number')
      .eq('batch_id', batch.id);
    return {
      success: true,
      batchId: batch.id,
      orderNumbers: (existingOrders || []).map((o) => o.order_number).filter(Boolean),
      alreadyProcessed: true,
    };
  }

  const { data: claimedBatch, error: claimError } = await supabase
    .from('order_batches')
    .update({ paid_at: new Date().toISOString() })
    .eq('id', batch.id)
    .is('paid_at', null)
    .select()
    .maybeSingle();

  if (claimError) {
    return { success: false, error: claimError.message };
  }
  if (!claimedBatch) {
    const { data: existingOrders } = await supabase
      .from('orders')
      .select('order_number')
      .eq('batch_id', batch.id);
    return {
      success: true,
      batchId: batch.id,
      orderNumbers: (existingOrders || []).map((o) => o.order_number).filter(Boolean),
      alreadyProcessed: true,
    };
  }

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('batch_id', batch.id)
    .eq('status', 'to_pay');

  if (ordersError) {
    return { success: false, error: ordersError.message };
  }

  const orderNumbers = [];

  for (const order of orders || []) {
    const orderNumber = generateOrderNumber();
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'pending_purchase', order_number: orderNumber, paid_at: new Date().toISOString() })
      .eq('id', order.id);

    if (updateError) {
      console.error('Failed to update order in batch:', updateError.message);
      continue;
    }

    orderNumbers.push(orderNumber);

    await notifyCustomer({
      customerId: order.customer_id,
      type: 'order_status',
      title: 'Payment received',
      orderId: order.id,
      message: `Your order ${orderNumber} for ${order.product_name} has been paid and is now pending purchase from the supplier.`,
    });
  }

  return { success: true, batchId: batch.id, orderNumbers };
}

/** Same idea, for a shipping payment on a warehouse shipment — unchanged. */
export async function confirmShipmentPayment(reference, supabaseOverride) {
  const supabase = supabaseOverride || createClient();

  let verified;
  try {
    verified = await verifyPaystackTransaction(reference);
  } catch (err) {
    return { success: false, error: err.message };
  }

  const { data: shipment } = await supabase
    .from('shipments')
    .select('*')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (!shipment) {
    return { success: false, error: 'No shipment found for this payment reference.' };
  }

  if (verified.status !== 'success') {
    return { success: false, error: 'Payment was not successful.' };
  }

  if (shipment.paid_at) {
    return { success: true, shipmentId: shipment.id, alreadyProcessed: true };
  }

  const { error: updateError } = await supabase
    .from('shipments')
    .update({ paid_at: new Date().toISOString() })
    .eq('id', shipment.id)
    .is('paid_at', null);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const { data: items } = await supabase
    .from('warehouse_items')
    .select('order_id, customer_id')
    .eq('shipment_id', shipment.id);

  if (items?.length) {
    const orderIds = items.map((i) => i.order_id);
    await supabase.from('orders').update({ status: 'packing' }).in('id', orderIds);

    for (const item of items) {
      await notifyCustomer({
        customerId: item.customer_id,
        type: 'shipment_dispatched',
        title: 'Shipping paid — your package is being packed',
        message: `Payment for your shipment (${shipment.courier}) has been received. It's now being packed for dispatch.`,
      });
    }
  }

  return { success: true, shipmentId: shipment.id };
}
