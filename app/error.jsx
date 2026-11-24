'use client';

import { useEffect, useState } from 'react';
import { userFacingError } from '@/lib/user-facing-error';
import { reportClientError } from '@/lib/report-client-error';

export default function ErrorPage({ error, reset }) {
  const [clientErrorId, setClientErrorId] = useState('');
  const errorId = error?.digest || clientErrorId;

  useEffect(() => {
    if (error?.digest) return;
    const reportedId = reportClientError(error, 'app.error_boundary') || '';
    void Promise.resolve().then(() => setClientErrorId(reportedId));
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-ink-fog">Unexpected error</p>
      <h1 className="mt-4 font-display text-3xl text-ink">We couldn&apos;t load this page.</h1>
      <p className="mt-3 text-sm text-ink-fog">
        {errorId
          ? `Something went wrong. Please try again. Reference ID: ${errorId}`
          : userFacingError(error, 'Please try again in a moment.')}
      </p>
      <button onClick={reset} className="mt-8 rounded-full bg-ink px-6 py-3 text-sm text-canvas">
        Try again
      </button>
    </main>
  );
}
