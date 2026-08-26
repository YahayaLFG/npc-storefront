'use client';

import { useTransition } from 'react';
import { deleteProductAdmin } from '@/lib/admin/products';
import { useRouter } from 'next/navigation';

export default function DeleteProductButton({ id, name }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    startTransition(async () => {
      await deleteProductAdmin(id);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-fog hover:text-bone disabled:opacity-50"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  );
}
