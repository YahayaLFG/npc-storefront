import { Suspense } from 'react';
import LoginForm from '@/components/account/LoginForm';

export const metadata = { title: 'Sign In — NPC' };

export default function AccountLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
