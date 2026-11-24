'use server';

import { createClient } from '../supabase/server';
import { createServiceRoleClient } from '../supabase/serviceRole';
import { applyStoragePolicy } from '../storagePolicy';
import { initializePaystackTransaction } from '../paystack';
import { calculateShippingCost, COURIERS } from '../shipping';
import { logServerError, publicError, publicServerException } from '../server-error';

export async function getMyWarehouseItems() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  await applyStoragePolicy(createServiceRoleClient(), user.id);

  const { data, error } = await supabase
    .from('warehouse_items')
    .select('*, orders(order_number, product_name, product_image, variant_color, variant_size)')
    .eq('customer_id', user.id)
    .order('received_at', { ascending: false });

  if (error) {
    logServerError('account.get_warehouse_items', error);
    return [];
  }
  return data;
}

export async function extendMyStorage(itemId, extraDays) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('extend_warehouse_storage', {
    item_id: itemId,
    extra_days: Number(extraDays),
  });
  if (error) throw publicServerException('account.extend_storage', error);
}

function buildReference(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function initiateShipmentCheckout({ itemIds, courier = 'standard' }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'not_authenticated' };

  if (!itemIds?.length) return { error: 'Select at least one item to ship.' };

  const { data: items, error: itemsError } = await supabase
    .from('warehouse_items')
    .select('id, weight_kg, shipment_id, customer_id')
    .in('id', itemIds);

  if (itemsError) return publicError('account.load_shipment_items', itemsError, 'Could not start shipping. Please try again.');

  const owned = items.filter((i) => i.customer_id === user.id && !i.shipment_id);
  if (owned.length !== itemIds.length) {
    return { error: 'One or more selected items are no longer available to ship.' };
  }
  const missingWeight = owned.some((i) => !i.weight_kg);
  if (missingWeight) {
    return { error: "One or more items don't have a weight yet — check back once it's been measured." };
  }

  const totalWeightKg = owned.reduce((sum, i) => sum + Number(i.weight_kg), 0);
  const shippingCost = calculateShippingCost(totalWeightKg, courier);
  const courierLabel = COURIERS.find((c) => c.value === courier)?.label || 'Standard';
  const reference = buildReference('npc-shipping');

  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .insert({
      customer_id: user.id,
      courier: courierLabel,
      shipping_cost: shippingCost,
      total_weight_kg: totalWeightKg,
      status: 'packing',
      paystack_reference: reference,
    })
    .select()
    .maybeSingle();

  if (shipmentError) return publicError('account.create_shipment', shipmentError, 'Could not start shipping. Please try again.');

  const { error: assignError } = await supabase.rpc('assign_items_to_shipment', {
    item_ids: itemIds,
    target_shipment_id: shipment.id,
  });
  if (assignError) return publicError('account.assign_shipment_items', assignError, 'Could not start shipping. Please try again.');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return publicError('account.shipping_missing_app_url', new Error('NEXT_PUBLIC_APP_URL is not set.'), 'Shipping payment is temporarily unavailable.');
  }

  try {
    const transaction = await initializePaystackTransaction({
      email: user.email,
      amountNgn: shippingCost,
      reference,
      callbackUrl: `${appUrl}/checkout/shipping-callback`,
      metadata: { shipmentId: shipment.id, kind: 'shipping' },
    });

    return { authorizationUrl: transaction.authorization_url };
  } catch (err) {
    return publicError('account.initialize_shipping_payment', err, 'Could not start shipping payment. Please try again.');
  }
}

export async function getMyShipmentById(shipmentId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: shipment, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('id', shipmentId)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (error || !shipment) return null;

  const { data: items } = await supabase
    .from('warehouse_items')
    .select('*, orders(order_number, product_name, product_image, variant_color, variant_size)')
    .eq('shipment_id', shipmentId);

  return { ...shipment, items: items || [] };
}

export async function getMyShipments() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('shipments')
    .select('*')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}
