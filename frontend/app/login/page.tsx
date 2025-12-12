import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import LoginPageContent from '@/src/components/LoginPageContent';
import { isUserToken } from '@/src/lib/jwt';

type SearchParams = { error?: string } | Promise<{ error?: string }>;

/**
 * Login page for doctors
 * If already logged in as doctor, redirect to form
 * Prevents admin users from accessing doctor portal
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  // If already logged in as doctor, redirect to form
  if (token && isUserToken(token)) {
    redirect('/');
  }

  // If logged in as admin, redirect with error
  if (token && !isUserToken(token)) {
    redirect('/login?error=admin_detected');
  }

  // Resolve searchParams if it's a Promise (Next.js 15+)
  const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
  const error = resolvedParams?.error;

  // Map error codes to user-friendly messages
  let errorMessage: string | undefined;
  if (error === 'invalid_token') {
    errorMessage = 'Neplatný odkaz. Prosím použijte platný odkaz nebo se přihlaste pomocí hesla.';
  } else if (error === 'account_pending') {
    errorMessage = 'Váš účet čeká na schválení administrátorem. Prosím počkejte na schválení.';
  } else if (error === 'password_required') {
    errorMessage = 'Tento účet vyžaduje přihlášení pomocí hesla. Prosím použijte přihlašovací formulář.';
  } else if (error === 'admin_detected') {
    errorMessage = 'Tento portál je určen pouze pro lékaře. Pro přístup jako administrátor použijte administrační portál.';
  }

  return <LoginPageContent initialError={errorMessage || error} />;
}

