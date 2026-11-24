'use server';

import { createClient } from '../supabase/server';
import { verifyPaystackTransaction } from '../paystack';
import { generateOrderNumber } from './orderNumber';
import { notifyCustomer } from '../notifications';
import { createServiceRoleClient } from '../supabase/serviceRole';
import { applyStoragePolicy } from '../storagePolicy';
import { logServerError, publicError } from '../server-error';

function paymentError(context, error) {
  return { success: false, ...publicError(context, error, 'We could not confirm this payment. Please contact support if you were charged.') };
}

/**
 * Confirms a cart checkout payment by reference. Always re-verifies with
 * Paystack server-side first. A payment reference belongs to an
 * order_batches row (one payment can cover several cart items). On
 * success, every order in the batch gets its own order_number and moves
 * to 'pending_purchase' — independently trackable from here on.
 *
 * Each order moves from to_pay only once, and the batch is marked paid
 * after every order has been confirmed. This lets webhook retries recover
 * cleanly from partial database failures.
 */
export async function confirmOrderPayment(reference, supabaseOverride) {
  const supabase = supabaseOverride || await createClient();

  let verified;
  try {
    verified = await verifyPaystackTransaction(reference);
  } catch (err) {
    return paymentError('payments.verify_order', err);
  }

  const { data: batch, error: batchError } = await supabase
    .from('order_batches')
    .select('*')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (batchError) return paymentError('payments.load_order_batch', batchError);
  if (!batch) {
    return paymentError('payments.order_reference_not_found', new Error('No order batch found for payment reference.'));
  }

  if (
    verified.status !== 'success' ||
    verified.reference !== reference ||
    verified.currency !== 'NGN' ||
    Number(verified.amount) !== Math.round(Number(batch.total_amount) * 100)
  ) {
    return { success: false, error: 'Payment was not successful.' };
  }

  if (batch.paid_at) {
    try {
      await applyStoragePolicy(createServiceRoleClient(), batch.customer_id);
    } catch (err) {
      logServerError('payments.storage_policy_after_order', err);
    }
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
    return paymentError('payments.load_batch_orders', ordersError);
  }
  if (!orders?.length) {
    const { data: existingOrders, error: existingOrdersError } = await supabase
      .from('orders')
      .select('order_number, status')
      .eq('batch_id', batch.id);
    if (existingOrdersError) return paymentError('payments.load_existing_orders', existingOrdersError);
    if (!existingOrders?.length || existingOrders.some((order) => order.status === 'to_pay')) {
      return paymentError('payments.incomplete_order_batch', new Error('Payment has no complete order batch.'));
    }
  }

  const orderNumbers = [];
  const processedOrders = [];

  for (const order of orders || []) {
    const orderNumber = generateOrderNumber();
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'pending_purchase', order_number: orderNumber, paid_at: new Date().toISOString() })
      .eq('id', order.id)
      .eq('status', 'to_pay')
      .select('id, order_number')
      .maybeSingle();

    if (updateError) {
      return paymentError('payments.update_paid_order', updateError);
    }
    if (!updatedOrder) continue;

    orderNumbers.push(updatedOrder.order_number);
    processedOrders.push({ ...order, orderNumber: updatedOrder.order_number });
  }

  const { data: unpaidOrders, error: unpaidOrdersError } = await supabase
    .from('orders')
    .select('id')
    .eq('batch_id', batch.id)
    .eq('status', 'to_pay');
  if (unpaidOrdersError) return paymentError('payments.check_batch_completion', unpaidOrdersError);
  if (unpaidOrders?.length) {
    return { success: false, error: 'Order confirmation is still processing. Please retry shortly.' };
  }

  const { error: markPaidError } = await supabase
    .from('order_batches')
    .update({ paid_at: new Date().toISOString() })
    .eq('id', batch.id)
    .is('paid_at', null);
  if (markPaidError) return paymentError('payments.mark_batch_paid', markPaidError);

  for (const order of processedOrders) {
    try {
      await notifyCustomer({
        customerId: order.customer_id,
        type: 'order_status',
        title: 'Payment received',
        orderId: order.id,
        message: `Your order ${order.orderNumber} for ${order.product_name} has been paid and is now being processed.`,
      });
    } catch (err) {
      logServerError('payments.order_notification', err);
    }
  }

  try {
    await applyStoragePolicy(createServiceRoleClient(), batch.customer_id);
  } catch (err) {
    logServerError('payments.storage_policy_after_order', err);
  }

  const { data: allOrders, error: allOrdersError } = await supabase
    .from('orders')
    .select('order_number')
    .eq('batch_id', batch.id);
  if (allOrdersError) logServerError('payments.load_confirmed_order_numbers', allOrdersError);

  return {
    success: true,
    batchId: batch.id,
    orderNumbers: [...new Set([...(allOrders || []).map((o) => o.order_number).filter(Boolean), ...orderNumbers])],
  };
}

/** Confirms and records shipment payment from either the callback or webhook. */
export async function confirmShipmentPayment(reference, supabaseOverride) {
  const supabase = supabaseOverride || await createClient();

  let verified;
  try {
    verified = await verifyPaystackTransaction(reference);
  } catch (err) {
    return paymentError('payments.verify_shipment', err);
  }

  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .select('*')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (shipmentError) return paymentError('payments.load_shipment', shipmentError);
  if (!shipment) {
    return paymentError('payments.shipment_reference_not_found', new Error('No shipment found for payment reference.'));
  }

  if (
    verified.status !== 'success' ||
    verified.reference !== reference ||
    verified.currency !== 'NGN' ||
    Number(verified.amount) !== Math.round(Number(shipment.shipping_cost) * 100)
  ) {
    return { success: false, error: 'Payment was not successful.' };
  }

  if (shipment.paid_at) {
    return { success: true, shipmentId: shipment.id, alreadyProcessed: true };
  }

  const { data: items, error: itemsError } = await supabase
    .from('warehouse_items')
    .select('order_id, customer_id')
    .eq('shipment_id', shipment.id);
  if (itemsError) return paymentError('payments.load_shipment_items', itemsError);
  if (!items?.length) return paymentError('payments.empty_shipment', new Error('No warehouse items assigned to shipment.'));

  // Customer RLS intentionally blocks customers from advancing order
  // statuses or marking shipments paid. The service client is used only
  // after the session-scoped lookup and Paystack verification succeeded.
  const writer = supabaseOverride || createServiceRoleClient();
  const orderIds = items.map((item) => item.order_id);
  const { data: updatedOrders, error: updateOrdersError } = await writer
    .from('orders')
    .update({ status: 'packing' })
    .in('id', orderIds)
    .neq('status', 'packing')
    .select('id');
  if (updateOrdersError) return paymentError('payments.update_shipment_orders', updateOrdersError);

  const { data: paidShipment, error: updateShipmentError } = await writer
    .from('shipments')
    .update({ paid_at: new Date().toISOString() })
    .eq('id', shipment.id)
    .is('paid_at', null)
    .select('id')
    .maybeSingle();
  if (updateShipmentError) return paymentError('payments.mark_shipment_paid', updateShipmentError);
  if (!paidShipment) {
    return { success: true, shipmentId: shipment.id, alreadyProcessed: true };
  }

  const updatedOrderIds = new Set((updatedOrders || []).map((order) => order.id));
  for (const item of items.filter((candidate) => updatedOrderIds.has(candidate.order_id))) {
    try {
      await notifyCustomer({
        customerId: item.customer_id,
        type: 'shipment_dispatched',
        title: 'Shipping paid — your package is being packed',
        message: `Payment for your shipment (${shipment.courier}) has been received. It's now being packed for dispatch.`,
      });
    } catch (err) {
      logServerError('payments.shipment_notification', err);
    }
  }

  return { success: true, shipmentId: shipment.id };
}
