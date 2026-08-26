import { notFound } from 'next/navigation';
import { getMyShipmentById } from '@/lib/account/warehouse';
import { formatNGN } from '@/lib/format';
import PrintButton from '@/components/admin/PrintButton';

export default async function ShipmentInvoicePage({ params }) {
  const shipment = await getMyShipmentById(params.id);
  if (!shipment) notFound();

  return (
    <div className="min-h-screen bg-white px-8 py-12 text-black print:px-0 print:py-0">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start justify-between border-b border-black/20 pb-6">
          <div>
            <p className="font-serif text-2xl font-bold tracking-tight">NPC</p>
            <p className="mt-1 text-xs text-black/60">Shipping Invoice</p>
          </div>
          <PrintButton />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-black/50">Shipment</p>
            <p className="mt-1 font-mono text-xs">{shipment.id}</p>
            <p className="mt-1 text-black/60">Courier: {shipment.courier}</p>
            <p className="mt-1 text-black/60">
              Created: {new Date(shipment.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-black/50">Total</p>
            <p className="mt-1">{shipment.total_weight_kg} kg combined</p>
            <p className="mt-1 font-mono">{formatNGN(shipment.shipping_cost)}</p>
          </div>
        </div>

        <table className="mt-10 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/20 text-left text-xs uppercase tracking-wide text-black/50">
              <th className="py-2">Item</th>
              <th className="py-2">Order</th>
              <th className="py-2 text-right">Weight</th>
            </tr>
          </thead>
          <tbody>
            {shipment.items.map((item) => (
              <tr key={item.id} className="border-b border-black/10">
                <td className="py-3">
                  {item.orders?.product_name}
                  <span className="block text-xs text-black/50">
                    {item.orders?.variant_color} / {item.orders?.variant_size}
                  </span>
                </td>
                <td className="py-3 font-mono text-xs text-black/60">{item.orders?.order_number}</td>
                <td className="py-3 text-right font-mono">{item.weight_kg} kg</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-black/60">Combined weight</span>
              <span className="font-mono">{shipment.total_weight_kg} kg</span>
            </div>
            <div className="flex justify-between border-t border-black/20 pt-1 font-medium">
              <span>Shipping paid</span>
              <span className="font-mono">{formatNGN(shipment.shipping_cost)}</span>
            </div>
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-black/40">Thank you for shopping NPC.</p>
      </div>
    </div>
  );
}
