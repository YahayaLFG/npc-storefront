'use client';

import { useState } from 'react';
import { login } from '@/lib/admin/auth';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login({ email, password });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-5">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-2xl font-extrabold tracking-tightest text-bone">
          NPC<span className="text-fog"> / admin</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <div>
            <label htmlFor="email" className="text-xs uppercase tracking-wide text-mute">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border border-line bg-panel px-4 py-3 text-sm text-bone focus:border-bone"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs uppercase tracking-wide text-mute">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border border-line bg-panel px-4 py-3 text-sm text-bone focus:border-bone"
            />
          </div>

          {error && <p className="text-sm text-fog">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-bone py-3.5 text-sm font-medium text-black transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
