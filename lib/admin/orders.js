'use server';

import { createClient } from '../supabase/server';
import { initializePaystackTransaction } from '../paystack';
import { calculateShippingCost } from '../shipping';
import { notifyCustomer } from '../notifications';
import { orderStatusNotification } from '../orderStatus';
import { revalidatePath } from 'next/cache';

export async function getAllOrdersAdmin({ status, search } = {}) {
  const supabase = createClient();

  let query = supabase.from('orders').select('*, profiles!orders_customer_id_fkey(email, full_name)');

  if (status) query = query.eq('status', status);
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error('getAllOrdersAdmin error:', error.message);
    return [];
  }

  if (!search?.trim()) return data;

  const q = search.trim().toLowerCase();
  return data.filter((o) =>
    [o.order_number, o.product_name, o.profiles?.email, o.profiles?.full_name]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
  );
}

export async function getOrderDetailAdmin(id) {
  const supabase = createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('*, profiles!orders_customer_id_fkey(email, full_name, phone)')
    .eq('id', id)
    .maybeSingle();

  if (error || !order) return null;

  let authenticityTag = order.authenticity_tag || null;
  if (!authenticityTag && order.product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('authenticity_tag')
      .eq('id', order.product_id)
      .maybeSingle();
    authenticityTag = product?.authenticity_tag || null;
  }

  const { data: warehouseItem } = await supabase
    .from('warehouse_items')
    .select('*')
    .eq('order_id', id)
    .maybeSingle();

  // Surfaces the shared payment reference so the admin can see which
  // other orders (if any) came from the same checkout.
  let batch = null;
  if (order.batch_id) {
    const { data: batchRow } = await supabase
      .from('order_batches')
      .select('paystack_reference, total_amount, paid_at')
      .eq('id', order.batch_id)
      .maybeSingle();
    batch = batchRow;

    const { data: siblingOrders } = await supabase
      .from('orders')
      .select('id, order_number, product_name, status')
      .eq('batch_id', order.batch_id)
      .neq('id', id);
    batch = { ...batch, siblingOrders: siblingOrders || [] };
  }

  return { ...order, authenticityTag, warehouseItem, batch };
}

const SHIPMENT_STAGE_STATUSES = ['packing', 'in_transit', 'customs', 'delivered'];

export async function updateOrderStatus(orderId, newStatus) {
  const supabase = createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (newStatus === 'warehouse_received') {
    const { data: existing } = await supabase
      .from('warehouse_items')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (!existing) {
      await supabase.from('warehouse_items').insert({
        order_id: orderId,
        customer_id: order.customer_id,
        received_at: new Date().toISOString(),
        free_storage_days: 7,
      });
    }
  }

  const notifiedCustomerIds = new Set();

  if (SHIPMENT_STAGE_STATUSES.includes(newStatus)) {
    const { data: myItem } = await supabase
      .from('warehouse_items')
      .select('shipment_id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (myItem?.shipment_id) {
      await supabase.from('shipments').update({ status: newStatus }).eq('id', myItem.shipment_id);

      const { data: siblingItems } = await supabase
        .from('warehouse_items')
        .select('order_id, customer_id')
        .eq('shipment_id', myItem.shipment_id);

      const siblingOrderIds = (siblingItems || []).map((i) => i.order_id).filter((id) => id !== orderId);
      if (siblingOrderIds.length) {
        await supabase.from('orders').update({ status: newStatus }).in('id', siblingOrderIds);
      }

      for (const item of siblingItems || []) {
        const { data: siblingOrder } = await supabase
          .from('orders')
          .select('order_number, customer_id')
          .eq('id', item.order_id)
          .maybeSingle();
        if (siblingOrder?.order_number && !notifiedCustomerIds.has(item.order_id)) {
          const { title, message } = orderStatusNotification(newStatus, siblingOrder.order_number);
          await notifyCustomer({
            customerId: siblingOrder.customer_id,
            type: 'order_status',
            title,
            message,
            orderId: item.order_id,
          });
          notifiedCustomerIds.add(item.order_id);
        }
      }
    }
  }

  if (order.order_number && !notifiedCustomerIds.has(orderId)) {
    const { title, message } = orderStatusNotification(newStatus, order.order_number);
    await notifyCustomer({ customerId: order.customer_id, type: 'order_status', title, message, orderId });
  }

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/account/orders');
  revalidatePath('/account/warehouse');

  return order;
}

export async function saveWarehouseDetails(orderId, { photos, weightKg, lengthCm, widthCm, heightCm }) {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from('warehouse_items')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle();

  const row = {
    photos: photos || [],
    weight_kg: weightKg ? Number(weightKg) : null,
    length_cm: lengthCm ? Number(lengthCm) : null,
    width_cm: widthCm ? Number(widthCm) : null,
    height_cm: heightCm ? Number(heightCm) : null,
  };

  if (existing) {
    const { error } = await supabase.from('warehouse_items').update(row).eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { data: order } = await supabase.from('orders').select('customer_id').eq('id', orderId).maybeSingle();
    if (!order) throw new Error('Order not found.');
    const { error } = await supabase
      .from('warehouse_items')
      .insert({ order_id: orderId, customer_id: order.customer_id, received_at: new Date().toISOString(), ...row });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/account/orders');
}

export async function extendStorageAdmin(orderId, extraDays) {
  const supabase = createClient();

  const { data: item, error: fetchError } = await supabase
    .from('warehouse_items')
    .select('id, extended_days')
    .eq('order_id', orderId)
    .maybeSingle();

  if (fetchError || !item) throw new Error('No warehouse item found for this order.');

  const { error } = await supabase
    .from('warehouse_items')
    .update({ extended_days: item.extended_days + Number(extraDays) })
    .eq('id', item.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/account/orders');
}

function buildReference(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function requestShippingPayment(orderId) {
  const supabase = createClient();

  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (!order) throw new Error('Order not found.');

  const { data: item } = await supabase.from('warehouse_items').select('*').eq('order_id', orderId).maybeSingle();
  if (!item) throw new Error('This order has no warehouse item yet.');
  if (!item.weight_kg) throw new Error('Set a weight for this item before requesting shipping payment.');
  if (item.shipment_id) throw new Error('This item is already part of a shipment.');

  const { data: profile } = await supabase.from('profiles').select('email').eq('id', order.customer_id).maybeSingle();
  if (!profile?.email) throw new Error("Could not find the customer's email.");

  const shippingCost = calculateShippingCost(item.weight_kg, 'standard');
  const reference = buildReference('npc_shipping');

  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .insert({
      customer_id: order.customer_id,
      courier: 'Standard',
      shipping_cost: shippingCost,
      total_weight_kg: item.weight_kg,
      status: 'packing',
      paystack_reference: reference,
    })
    .select()
    .maybeSingle();

  if (shipmentError) throw new Error(shipmentError.message);

  const { error: linkError } = await supabase
    .from('warehouse_items')
    .update({ shipment_id: shipment.id })
    .eq('id', item.id);
  if (linkError) throw new Error(linkError.message);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL is not set.');

  const transaction = await initializePaystackTransaction({
    email: profile.email,
    amountNgn: shippingCost,
    reference,
    callbackUrl: `${appUrl}/checkout/shipping-callback`,
    metadata: { shipmentId: shipment.id, kind: 'shipping' },
  });

  await notifyCustomer({
    customerId: order.customer_id,
    type: 'shipment_dispatched',
    title: `Shipping payment requested — ${order.order_number}`,
    message: `Your item is ready to ship. Pay ₦${shippingCost.toLocaleString('en-NG')} for shipping to have it sent: ${transaction.authorization_url}`,
    orderId,
  });

  revalidatePath(`/admin/orders/${orderId}`);

  return { authorizationUrl: transaction.authorization_url, shippingCost };
}
