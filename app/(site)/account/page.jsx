import Link from 'next/link';
import { getMyOrders } from '@/lib/account/orders';
import { logout } from '@/lib/account/auth';
import { orderStatusLabel } from '@/lib/orderStatus';
import { formatNGN } from '@/lib/format';
import { getMyNotifications } from '@/lib/notifications';
import NotificationRow from '@/components/account/NotificationRow';

export const metadata = { title: 'My Account — NPC' };

export default async function AccountPage() {
  const [orders, notifications] = await Promise.all([getMyOrders(), getMyNotifications()]);
  const recentOrders = orders.slice(0, 5);
  const recentNotifications = notifications.slice(0, 5);
  const activeCount = orders.filter((o) => o.status !== 'delivered').length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-14 md:px-8 md:py-20">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">Account</p>
          <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink md:text-4xl">
            Your dashboard
          </h1>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-ink-fog hover:text-ink">
            Log out
          </button>
        </form>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-4">
        <Link href="/account/orders" className="border border-rule p-5 hover:border-ink">
          <p className="font-mono text-2xl text-ink">{activeCount}</p>
          <p className="mt-1 text-sm text-ink-fog">Active orders</p>
        </Link>
        <Link href="/account/warehouse" className="border border-rule p-5 hover:border-ink">
          <p className="font-display text-lg text-ink">Warehouse</p>
          <p className="mt-1 text-sm text-ink-fog">View stored items</p>
        </Link>
        <a href="#notifications" className="border border-rule p-5 hover:border-ink">
          <p className="font-mono text-2xl text-ink">{unreadCount}</p>
          <p className="mt-1 text-sm text-ink-fog">New notifications</p>
        </a>
        <Link href="/shop" className="border border-rule p-5 hover:border-ink">
          <p className="font-display text-lg text-ink">Shop</p>
          <p className="mt-1 text-sm text-ink-fog">Add something new</p>
        </Link>
      </div>

      <div className="mt-14">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">Recent orders</h2>
          <Link href="/account/orders" className="text-sm text-ink-fog hover:text-ink">
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-6 text-ink-fog">No orders yet.</p>
        ) : (
          <div className="mt-6 divide-y divide-rule border-t border-b border-rule">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.order_number || order.id}`}
                className="flex items-center gap-4 py-4"
              >
                <div className="h-16 w-14 shrink-0 overflow-hidden bg-canvas-alt">
                  {order.product_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={order.product_image} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-ink">{order.product_name}</p>
                  <p className="mt-1 font-mono text-xs text-ink-fog">
                    {order.order_number || 'Awaiting payment'}
                  </p>
                </div>
                <span className="rounded-full border border-rule px-3 py-1 text-xs text-ink-fog">
                  {orderStatusLabel(order.status)}
                </span>
                <span className="font-mono text-sm text-ink">{formatNGN(order.product_price)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div id="notifications" className="mt-14">
        <h2 className="font-display text-xl text-ink">Notifications</h2>

        {recentNotifications.length === 0 ? (
          <p className="mt-6 text-ink-fog">Nothing yet — you'll see updates on your orders here.</p>
        ) : (
          <div className="mt-6 divide-y divide-rule border-t border-b border-rule">
            {recentNotifications.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
