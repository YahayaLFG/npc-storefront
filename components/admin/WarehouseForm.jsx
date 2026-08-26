'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, X } from 'lucide-react';
import { uploadProductImage } from '@/lib/admin/upload';
import { saveWarehouseDetails, extendStorageAdmin, requestShippingPayment } from '@/lib/admin/orders';
import { formatNGN } from '@/lib/format';

export default function WarehouseForm({ orderId, warehouseItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [photos, setPhotos] = useState(warehouseItem?.photos || []);
  const [weightKg, setWeightKg] = useState(warehouseItem?.weight_kg ?? '');
  const [lengthCm, setLengthCm] = useState(warehouseItem?.length_cm ?? '');
  const [widthCm, setWidthCm] = useState(warehouseItem?.width_cm ?? '');
  const [heightCm, setHeightCm] = useState(warehouseItem?.height_cm ?? '');
  const [extraDays, setExtraDays] = useState(7);

  const daysLeft = warehouseItem
    ? Math.ceil(
        (new Date(warehouseItem.received_at).getTime() +
          (warehouseItem.free_storage_days + warehouseItem.extended_days) * 86400000 -
          Date.now()) /
          86400000
      )
    : null;

  async function handlePhotoUpload(files) {
    if (!files?.length) return;
    setUploading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadProductImage(file, 'warehouse'));
      }
      setPhotos((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleSaveDetails() {
    setError('');
    setNotice('');
    startTransition(async () => {
      try {
        await saveWarehouseDetails(orderId, { photos, weightKg, lengthCm, widthCm, heightCm });
        setNotice('Saved.');
        router.refresh();
      } catch (err) {
        setError(err.message);
      }
    });
  }

  function handleExtend() {
    setError('');
    setNotice('');
    startTransition(async () => {
      try {
        await extendStorageAdmin(orderId, extraDays);
        setNotice(`Storage extended by ${extraDays} days.`);
        router.refresh();
      } catch (err) {
        setError(err.message);
      }
    });
  }

  function handleRequestShipping() {
    setError('');
    setNotice('');
    startTransition(async () => {
      try {
        const result = await requestShippingPayment(orderId);
        setNotice(`Shipping payment link sent to the customer — ${formatNGN(result.shippingCost)}.`);
        router.refresh();
      } catch (err) {
        setError(err.message);
      }
    });
  }

  if (!warehouseItem) {
    return (
      <div className="border border-line p-5">
        <p className="text-xs uppercase tracking-wide text-mute">Warehouse</p>
        <p className="mt-2 text-sm text-fog">
          No warehouse item yet — advance this order's status to "Warehouse Received" to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-line p-5">
      <p className="text-xs uppercase tracking-wide text-mute">Warehouse</p>

      <div className="mt-4">
        <p className="text-xs text-mute">Photos</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {photos.map((src, i) => (
            <div key={src + i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-24 w-24 border border-line object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -right-2 -top-2 border border-line bg-black p-1 text-bone"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-line bg-panel text-center">
            <UploadCloud size={16} className="text-bone" />
            <span className="text-[10px] text-mute">{uploading ? 'Uploading…' : 'Add'}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handlePhotoUpload(e.target.files)}
            />
          </label>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="text-xs text-mute">Weight (kg)</label>
          <input
            type="number"
            step="0.01"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="mt-1 w-full border border-line bg-panel px-3 py-2 text-sm text-bone focus:border-bone"
          />
        </div>
        <div>
          <label className="text-xs text-mute">Length (cm)</label>
          <input
            type="number"
            step="0.1"
            value={lengthCm}
            onChange={(e) => setLengthCm(e.target.value)}
            className="mt-1 w-full border border-line bg-panel px-3 py-2 text-sm text-bone focus:border-bone"
          />
        </div>
        <div>
          <label className="text-xs text-mute">Width (cm)</label>
          <input
            type="number"
            step="0.1"
            value={widthCm}
            onChange={(e) => setWidthCm(e.target.value)}
            className="mt-1 w-full border border-line bg-panel px-3 py-2 text-sm text-bone focus:border-bone"
          />
        </div>
        <div>
          <label className="text-xs text-mute">Height (cm)</label>
          <input
            type="number"
            step="0.1"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="mt-1 w-full border border-line bg-panel px-3 py-2 text-sm text-bone focus:border-bone"
          />
        </div>
      </div>

      <button
        onClick={handleSaveDetails}
        disabled={isPending || uploading}
        className="mt-4 rounded-full bg-bone px-5 py-2.5 text-xs font-medium text-black disabled:opacity-40"
      >
        Save Warehouse Details
      </button>

      <div className="mt-6 border-t border-line pt-4">
        <p className="text-xs text-mute">
          Received {new Date(warehouseItem.received_at).toLocaleDateString()} — free storage{' '}
          {warehouseItem.free_storage_days + warehouseItem.extended_days} days total.{' '}
          {daysLeft !== null && (
            <span className={daysLeft <= 0 ? 'text-fog' : ''}>
              {daysLeft > 0 ? `${daysLeft} days left.` : 'Expired.'}
            </span>
          )}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="number"
            value={extraDays}
            onChange={(e) => setExtraDays(Number(e.target.value))}
            className="w-20 border border-line bg-panel px-3 py-2 text-sm text-bone focus:border-bone"
          />
          <button
            onClick={handleExtend}
            disabled={isPending}
            className="rounded-full border border-line px-4 py-2 text-xs text-bone disabled:opacity-40"
          >
            Extend Storage
          </button>
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-4">
        {warehouseItem.shipment_id ? (
          <p className="text-sm text-fog">Already part of a shipment.</p>
        ) : (
          <button
            onClick={handleRequestShipping}
            disabled={isPending || !weightKg}
            className="rounded-full bg-bone px-5 py-2.5 text-xs font-medium text-black disabled:opacity-40"
            title={!weightKg ? 'Set a weight first' : ''}
          >
            Request Shipping Payment
          </button>
        )}
      </div>

      {notice && <p className="mt-3 text-sm text-bone">{notice}</p>}
      {error && <p className="mt-3 text-sm text-fog">{error}</p>}
    </div>
  );
}
