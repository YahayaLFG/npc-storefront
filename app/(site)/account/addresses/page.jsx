import AddressesClient from './AddressesClient';
import { getMyAddresses } from '@/lib/account/addresses';

export const metadata = { title: 'My Addresses — NPC' };

export default async function AddressesPage() {
  const addresses = await getMyAddresses();

  return (
    <div className="mx-auto max-w-2xl px-5 py-14 md:px-8 md:py-20">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">Account</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
        My Addresses
      </h1>
      <div className="mt-10">
        <AddressesClient initialAddresses={addresses} />
      </div>
    </div>
  );
}
