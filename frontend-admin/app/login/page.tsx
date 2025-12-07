/**
 * Login page
 * Handles admin authentication
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import LoginForm from '@/src/components/LoginForm';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');

  // If already logged in, redirect to dashboard
  if (token) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">JOY MED Admin</h2>
          <p className="mt-2 text-sm text-gray-600">Přihlaste se do administračního portálu</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

