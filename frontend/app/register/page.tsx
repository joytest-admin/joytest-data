import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import RegistrationForm from '@/src/components/RegistrationForm';

/**
 * Registration page for doctors (preregistration)
 * Allows choosing password-based or passwordless authentication
 */
export default async function RegisterPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (token) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <img
            src="/joymed_logo.webp"
            alt="JOY MED"
            className="mx-auto h-12 sm:h-16 w-auto"
          />
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
            Registrace lékaře
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Po odeslání vaši registraci schválí administrátor. O výsledku vás budeme informovat.
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow sm:p-8">
          <RegistrationForm />
          <p className="mt-4 text-center text-sm text-gray-600">
            Už máte účet?{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Přihlaste se zde
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

