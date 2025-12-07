import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import LoginPageContent from '@/src/components/LoginPageContent';

/**
 * Login page for doctors
 * If already logged in, redirect to form
 */
export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  // If already logged in, redirect to form
  if (token) {
    redirect('/');
  }

  return <LoginPageContent />;
}

