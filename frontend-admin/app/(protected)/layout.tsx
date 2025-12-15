/**
 * Protected layout
 * Wraps authenticated pages with navigation
 * Ensures only admin users can access admin portal
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Navigation from '@/src/components/Navigation';
import { isAdminToken, isValidToken } from '@/src/lib/jwt';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  // Redirect to login if not authenticated
  if (!token) {
    redirect('/login');
  }

  // If token exists but is invalid, redirect to login
  if (!isValidToken(token)) {
    // Invalid token - redirect to login
    redirect('/login?error=invalid_token');
  }

  // Check if user is admin - decode token and verify role
  if (!isAdminToken(token)) {
    // Valid token but not admin - redirect with error
    redirect('/login?error=admin_required');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

