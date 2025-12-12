/**
 * Login page
 * Handles admin authentication
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import LoginForm from '@/src/components/LoginForm';
import { isAdminToken } from '@/src/lib/jwt';

type SearchParams = { error?: string } | Promise<{ error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  // If already logged in as admin, redirect to dashboard
  if (token && isAdminToken(token)) {
    redirect('/dashboard');
  }

  // Resolve searchParams if it's a Promise (Next.js 15+)
  const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
  const error = resolvedParams?.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">JOY MED Admin</h2>
          <p className="mt-2 text-sm text-gray-600">Přihlaste se do administračního portálu</p>
        </div>
        <LoginForm initialError={error} />
      </div>
    </div>
  );
}

