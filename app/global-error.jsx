'use client';

import { useEffect, useState } from 'react';
import { userFacingError } from '@/lib/user-facing-error';
import { reportClientError } from '@/lib/report-client-error';

export default function GlobalErrorPage({ error, reset }) {
  const [clientErrorId, setClientErrorId] = useState('');
  const errorId = error?.digest || clientErrorId;

  useEffect(() => {
    if (error?.digest) return;
    const reportedId = reportClientError(error, 'app.global_error_boundary') || '';
    void Promise.resolve().then(() => setClientErrorId(reportedId));
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white px-5 text-center text-neutral-900">
        <main className="max-w-xl py-20">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Unexpected error</p>
          <h1 className="mt-4 text-3xl font-semibold">We couldn&apos;t load this page.</h1>
          <p className="mt-3 text-sm text-neutral-600">
            {errorId
              ? `Something went wrong. Please try again. Reference ID: ${errorId}`
              : userFacingError(error, 'Please try again in a moment.')}
          </p>
          <button onClick={reset} className="mt-8 rounded-full bg-neutral-900 px-6 py-3 text-sm text-white">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
