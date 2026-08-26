import { Suspense } from 'react';
import SignupForm from '@/components/account/SignupForm';

export const metadata = { title: 'Create Account — NPC' };

export default function AccountSignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
