export const ORDER_STATUSES = [
  { value: 'to_pay', label: 'To Pay' },
  { value: 'pending_purchase', label: 'Pending Purchase' },
  { value: 'purchased', label: 'Purchased' },
  { value: 'seller_shipped', label: 'Seller Shipped' },
  { value: 'warehouse_received', label: 'Warehouse Received' },
  { value: 'stored', label: 'Stored in Warehouse' },
  { value: 'ready_to_ship', label: 'Ready to Ship' },
  { value: 'packing', label: 'Packing' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'customs', label: 'Customs' },
  { value: 'delivered', label: 'Delivered' },
];

export function orderStatusLabel(value) {
  return ORDER_STATUSES.find((s) => s.value === value)?.label || value;
}

export function orderStatusIndex(value) {
  return ORDER_STATUSES.findIndex((s) => s.value === value);
}

/**
 * What the customer gets notified when their order moves to each status.
 */
export function orderStatusNotification(status, orderNumber) {
  const messages = {
    purchased: `We've purchased ${orderNumber} from the supplier.`,
    seller_shipped: `${orderNumber} has shipped from the seller and is on its way to our warehouse.`,
    warehouse_received: `${orderNumber} has arrived at our warehouse. It's stored free for 7 days — check your dashboard for photos and details.`,
    stored: `${orderNumber} is safely stored in our warehouse.`,
    ready_to_ship: `${orderNumber} is ready to ship whenever you are — combine it with other items or ship it on its own from your warehouse.`,
    packing: `${orderNumber} is being packed for dispatch.`,
    in_transit: `${orderNumber} is in transit to you.`,
    customs: `${orderNumber} has reached customs.`,
    delivered: `${orderNumber} has been delivered. Thank you for shopping NPC.`,
  };
  return {
    title: `${orderStatusLabel(status)} — ${orderNumber}`,
    message: messages[status] || `${orderNumber} is now ${orderStatusLabel(status)}.`,
  };
}

/** The shipment sub-lifecycle, once items are combined and shipped. */
export const SHIPMENT_STATUSES = [
  { value: 'packing', label: 'Packing' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'customs', label: 'Customs' },
  { value: 'delivered', label: 'Delivered' },
];

export function shipmentStatusLabel(value) {
  return SHIPMENT_STATUSES.find((s) => s.value === value)?.label || value;
}
