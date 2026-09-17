'use client';

import { useState } from 'react';
import { Plus, Star, Pencil, Trash2 } from 'lucide-react';
import { deleteAddress, setDefaultAddress } from '@/lib/account/addresses';
import AddressForm from '@/components/account/AddressForm';

export default function AddressesClient({ initialAddresses }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);

  function handleSaved(address) {
    setAddresses((prev) => {
      const withoutDefaultConflict = address.is_default
        ? prev.map((a) => ({ ...a, is_default: false }))
        : prev;
      const exists = withoutDefaultConflict.some((a) => a.id === address.id);
      return exists
        ? withoutDefaultConflict.map((a) => (a.id === address.id ? address : a))
        : [address, ...withoutDefaultConflict];
    });
    setEditingId(null);
    setAdding(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this address?')) return;
    const result = await deleteAddress(id);
    if (!result?.error) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
  }

  async function handleSetDefault(id) {
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
    await setDefaultAddress(id);
  }

  return (
    <div>
      {addresses.length === 0 && !adding && (
        <p className="text-ink-fog">No saved addresses yet.</p>
      )}

      <div className="space-y-4">
        {addresses.map((addr) =>
          editingId === addr.id ? (
            <div key={addr.id} className="border border-rule p-5">
              <AddressForm initial={addr} onSaved={handleSaved} onCancel={() => setEditingId(null)} />
            </div>
          ) : (
            <div key={addr.id} className="flex items-start justify-between gap-4 border border-rule p-5">
              <div className="text-sm">
                <p className="flex items-center gap-2 text-ink">
                  {addr.full_name}
                  {addr.is_default && (
                    <span className="flex items-center gap-1 text-xs text-ink-fog">
                      <Star size={12} className="fill-ink-fog" /> Default
                    </span>
                  )}
                </p>
                <p className="mt-1 text-ink-fog">{addr.phone}</p>
                <p className="mt-1 text-ink-fog">
                  {addr.address_line_1}
                  {addr.address_line_2 && `, ${addr.address_line_2}`}
                </p>
                <p className="text-ink-fog">
                  {[addr.area, addr.city, addr.state].filter(Boolean).join(', ')}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2 text-xs">
                <button onClick={() => setEditingId(addr.id)} className="flex items-center gap-1 text-ink-fog hover:text-ink">
                  <Pencil size={12} /> Edit
                </button>
                {!addr.is_default && (
                  <button onClick={() => handleSetDefault(addr.id)} className="text-ink-fog hover:text-ink">
                    Set default
                  </button>
                )}
                <button onClick={() => handleDelete(addr.id)} className="flex items-center gap-1 text-ink-fog hover:text-ink">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {adding ? (
        <div className="mt-6 border border-rule p-5">
          <AddressForm onSaved={handleSaved} onCancel={() => setAdding(false)} />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-6 flex items-center gap-2 rounded-full border border-ink px-5 py-2.5 text-xs font-medium text-ink"
        >
          <Plus size={14} /> Add Address
        </button>
      )}
    </div>
  );
}
