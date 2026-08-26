import Link from 'next/link';

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-5 text-center text-ink">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-fog">404</p>
      <h1 className="mt-3 font-display text-3xl">This page doesn't exist. Yet.</h1>
      <p className="mt-3 text-ink-fog">The page you're looking for doesn't exist or has moved.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-sm font-medium text-canvas">
        Back to home
      </Link>
    </div>
  );
}
