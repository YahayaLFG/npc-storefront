'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resendSignupConfirmation, signup } from '@/lib/account/auth';
import { captureUserFacingError } from '@/lib/user-facing-error';

export default function SignupForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/account';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [resending, setResending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signup({ email, password, fullName, redirectTo });
      if (result?.error) {
        setError(result.error);
      } else if (result?.confirmationRequired) {
        setPendingEmail(result.email);
        setPassword('');
      }
    } catch (err) {
      setError(captureUserFacingError(err, 'account.signup_action', 'We could not create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMessage('');
    try {
      const result = await resendSignupConfirmation(pendingEmail);
      setResendMessage(result?.error || 'If that address has a pending signup, a new confirmation email is on its way.');
    } catch (err) {
      setResendMessage(captureUserFacingError(err, 'account.resend_confirmation_action', 'We could not resend the email. Please try again shortly.'));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-20 md:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-fog">New here</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink">Create an account</h1>

      {pendingEmail ? (
        <div className="mt-8 space-y-4 text-sm text-ink-fog" role="status" aria-live="polite">
          <p>Check your inbox for a confirmation link sent to <strong className="font-semibold text-ink">{pendingEmail}</strong>. Confirm your email to finish creating your account.</p>
          <button type="button" onClick={handleResend} disabled={resending} className="text-ink underline underline-offset-2 disabled:opacity-60">
            {resending ? 'Sending…' : 'Resend confirmation email'}
          </button>
          {resendMessage && <p>{resendMessage}</p>}
          <p><Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-ink underline underline-offset-2">Back to sign in</Link></p>
        </div>
      ) : (
      <>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="fullName" className="text-xs uppercase tracking-wide text-ink-fog">Full name</label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-2 w-full border border-rule bg-canvas px-4 py-3 text-sm text-ink focus:border-ink"
          />
        </div>
        <div>
          <label htmlFor="email" className="text-xs uppercase tracking-wide text-ink-fog">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border border-rule bg-canvas px-4 py-3 text-sm text-ink focus:border-ink"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-xs uppercase tracking-wide text-ink-fog">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full border border-rule bg-canvas px-4 py-3 text-sm text-ink focus:border-ink"
          />
        </div>

        {error && <p className="text-sm text-ink-fog">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ink py-3.5 text-sm font-medium text-canvas disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-fog">
          Already have an account?{' '}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
            className="text-ink hover:underline"
          >
            Sign in
          </Link>
        </p>
      </>
      )}
    </div>
  );
}
