import Link from 'next/link';
import { logout } from '@/lib/admin/auth';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-black text-bone">
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-3 px-5 py-4 md:px-8">
          <Link href="/admin" className="font-display text-lg font-extrabold tracking-tightest">
            NPC <span className="text-fog">/ admin</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm sm:gap-6">
            <Link href="/admin/orders" className="text-fog hover:text-bone">Orders</Link>
            <Link href="/admin" className="text-fog hover:text-bone">Products</Link>
            <Link href="/admin/products/new" className="text-fog hover:text-bone">New Product</Link>
            <Link href="/" className="text-fog hover:text-bone" target="_blank">View site ↗</Link>
            <form action={logout}>
              <button type="submit" className="text-fog hover:text-bone">Log out</button>
            </form>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">{children}</div>
    </div>
  );
}
