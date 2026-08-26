import { notFound } from 'next/navigation';
import { getOrderDetailAdmin } from '@/lib/admin/orders';
import { formatNGN } from '@/lib/format';
import { orderStatusLabel } from '@/lib/orderStatus';
import PrintButton from '@/components/admin/PrintButton';

export default async function InvoicePage({ params }) {
  const order = await getOrderDetailAdmin(params.id);
  if (!order) notFound();

  return (
    <div className="min-h-screen bg-white px-8 py-12 text-black print:px-0 print:py-0">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start justify-between border-b border-black/20 pb-6">
          <div>
            <p className="font-serif text-2xl font-bold tracking-tight">NPC</p>
            <p className="mt-1 text-xs text-black/60">Order Invoice</p>
          </div>
          <PrintButton />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-black/50">Order</p>
            <p className="mt-1 font-mono">{order.order_number || '—'}</p>
            <p className="mt-1 text-black/60">Status: {orderStatusLabel(order.status)}</p>
            <p className="mt-1 text-black/60">
              Placed: {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-black/50">Bill To</p>
            <p className="mt-1">{order.profiles?.full_name || '—'}</p>
            <p className="text-black/60">{order.profiles?.email}</p>
            {order.profiles?.phone && <p className="text-black/60">{order.profiles.phone}</p>}
          </div>
        </div>

        <table className="mt-10 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/20 text-left text-xs uppercase tracking-wide text-black/50">
              <th className="py-2">Item</th>
              <th className="py-2">Variant</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/10">
              <td className="py-3">{order.product_name}</td>
              <td className="py-3 text-black/60">
                {order.variant_color} / {order.variant_size}
              </td>
              <td className="py-3 text-right">{order.quantity}</td>
              <td className="py-3 text-right font-mono">{formatNGN(order.product_price)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-black/60">Product total</span>
              <span className="font-mono">{formatNGN(order.product_price)}</span>
            </div>
            <div className="flex justify-between border-t border-black/20 pt-1 font-medium">
              <span>Total paid</span>
              <span className="font-mono">{formatNGN(order.product_price)}</span>
            </div>
          </div>
        </div>

        {order.warehouseItem && (
          <div className="mt-10 border-t border-black/20 pt-6 text-sm">
            <p className="text-xs uppercase tracking-wide text-black/50">Warehouse</p>
            <div className="mt-2 grid grid-cols-2 gap-3 text-black/70">
              {order.warehouseItem.weight_kg && <p>Weight: {order.warehouseItem.weight_kg} kg</p>}
              {order.warehouseItem.length_cm && (
                <p>
                  Dimensions: {order.warehouseItem.length_cm}×{order.warehouseItem.width_cm}×
                  {order.warehouseItem.height_cm} cm
                </p>
              )}
            </div>
          </div>
        )}

        <p className="mt-12 text-center text-xs text-black/40">Thank you for shopping NPC.</p>
      </div>
    </div>
  );
}
