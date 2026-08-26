import { getMyWarehouseItems } from '@/lib/account/warehouse';
import WarehouseClient from '@/components/account/WarehouseClient';

export const metadata = { title: 'My Warehouse — NPC' };

export default async function WarehousePage() {
  const items = await getMyWarehouseItems();

  return (
    <div className="mx-auto max-w-4xl px-5 py-14 md:px-8 md:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">Account</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
        My Warehouse
      </h1>
      <p className="mt-4 max-w-md text-sm text-ink-fog">
        Every item you've bought lands here first, stored free for 7 days. Ship pieces one at a
        time, or combine several into a single shipment to save on shipping.
      </p>

      <div className="mt-10">
        <WarehouseClient items={items} />
      </div>
    </div>
  );
}
