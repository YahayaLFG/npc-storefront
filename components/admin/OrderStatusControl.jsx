'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ORDER_STATUSES, orderStatusIndex } from '@/lib/orderStatus';
import { updateOrderStatus } from '@/lib/admin/orders';

export default function OrderStatusControl({ orderId, currentStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const currentIndex = orderStatusIndex(currentStatus);
  const nextStatus = ORDER_STATUSES[currentIndex + 1];

  function applyStatus(value) {
    setError('');
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, value);
        setStatus(value);
        router.refresh();
      } catch (err) {
        setError(err.message);
      }
    });
  }

  return (
    <div className="border border-line p-5">
      <p className="text-xs uppercase tracking-wide text-mute">Status</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-line bg-panel px-4 py-2.5 text-sm text-bone focus:border-bone"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => applyStatus(status)}
          disabled={isPending || status === currentStatus}
          className="rounded-full bg-bone px-5 py-2.5 text-xs font-medium text-black disabled:opacity-40"
        >
          {isPending ? 'Updating…' : 'Update Status'}
        </button>

        {nextStatus && (
          <button
            onClick={() => applyStatus(nextStatus.value)}
            disabled={isPending}
            className="rounded-full border border-line px-5 py-2.5 text-xs text-bone disabled:opacity-40"
          >
            Advance to "{nextStatus.label}" →
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-fog">{error}</p>}
      <p className="mt-3 text-xs text-mute">
        The customer is notified automatically whenever the status changes.
      </p>
    </div>
  );
}
