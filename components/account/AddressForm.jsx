'use client';

import { useState } from 'react';
import { saveAddress } from '@/lib/account/addresses';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

export default function AddressForm({ initial, onSaved, onCancel }) {
  const [fullName, setFullName] = useState(initial?.full_name || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [addressLine1, setAddressLine1] = useState(initial?.address_line_1 || '');
  const [addressLine2, setAddressLine2] = useState(initial?.address_line_2 || '');
  const [state, setState] = useState(initial?.state || '');
  const [city, setCity] = useState(initial?.city || '');
  const [area, setArea] = useState(initial?.area || '');
  const [isDefault, setIsDefault] = useState(initial?.is_default || false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const result = await saveAddress({
      id: initial?.id,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      state,
      city,
      area,
      isDefault,
    });

    setSaving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onSaved?.(result.address);
  }

  const inputClass =
    'mt-1.5 w-full border border-rule bg-canvas px-3 py-2.5 text-sm text-ink placeholder:text-ink-fog focus:border-ink';
  const labelClass = 'text-xs uppercase tracking-wide text-ink-fog';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} required />
        </div>
      </div>

      <div>
        <label className={labelClass}>Address</label>
        <input
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          placeholder="Street address"
          className={inputClass}
          required
        />
        <input
          value={addressLine2}
          onChange={(e) => setAddressLine2(e.target.value)}
          placeholder="Apartment, floor, landmark (optional)"
          className={`${inputClass} mt-2`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>State</label>
          <select value={state} onChange={(e) => setState(e.target.value)} className={inputClass} required>
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} required />
        </div>
      </div>

      <div>
        <label className={labelClass}>Area (optional)</label>
        <input value={area} onChange={(e) => setArea(e.target.value)} className={inputClass} />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="h-4 w-4 accent-ink" />
        Set as default address
      </label>

      {error && <p className="text-sm text-ink-fog">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-ink px-5 py-2.5 text-xs font-medium text-canvas disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Address'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-xs text-ink-fog underline underline-offset-2">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
