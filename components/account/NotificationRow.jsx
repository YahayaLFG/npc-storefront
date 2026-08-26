'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markNotificationRead } from '@/lib/notifications';

export default function NotificationRow({ notification }) {
  const router = useRouter();
  const [read, setRead] = useState(notification.read);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (read) return;
    startTransition(async () => {
      await markNotificationRead(notification.id);
      setRead(true);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex w-full items-start justify-between gap-4 py-4 text-left"
    >
      <div>
        <p className={`text-sm ${read ? 'text-ink-fog' : 'text-ink'}`}>{notification.title}</p>
        <p className="mt-1 text-xs text-ink-fog">{notification.message}</p>
        <p className="mt-1 font-mono text-[10px] text-ink-fog">
          {new Date(notification.created_at).toLocaleString()}
        </p>
      </div>
      {!read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-ink" />}
    </button>
  );
}
