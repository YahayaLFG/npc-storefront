'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { getMyNotifications, markNotificationRead } from '@/lib/notifications';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const panelRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    getMyNotifications()
      .then(setNotifications)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    markNotificationRead(id);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setOpen((v) => !v)} aria-label="Notifications" className="relative">
        <Bell size={20} />
        {loaded && unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 font-mono text-[9px] text-canvas">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-80 max-w-[90vw] border border-rule bg-canvas shadow-lg">
          <div className="border-b border-rule px-4 py-3">
            <p className="text-sm font-medium text-ink">Notifications</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-fog">Nothing yet.</p>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleRead(n.id)}
                  className="flex w-full flex-col items-start gap-1 border-b border-rule px-4 py-3 text-left last:border-b-0"
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className={`text-sm ${n.read ? 'text-ink-fog' : 'text-ink'}`}>{n.title}</span>
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />}
                  </span>
                  <span className="text-xs text-ink-fog">{n.message}</span>
                </button>
              ))
            )}
          </div>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block border-t border-rule px-4 py-3 text-center text-xs text-ink hover:underline"
          >
            View all in account
          </Link>
        </div>
      )}
    </div>
  );
}
