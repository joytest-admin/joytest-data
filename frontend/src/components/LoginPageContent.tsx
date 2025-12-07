'use client';

import { useTranslation } from '@/src/contexts/TranslationContext';
import LoginForm from './LoginForm';

/**
 * Login page content component (client-side for translations)
 */
export default function LoginPageContent() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <img
            src="/joymed_logo.webp"
            alt="JOY MED"
            className="mx-auto h-12 sm:h-16 w-auto"
          />
          <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-extrabold text-gray-900">
            {t.auth.login.title}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t.auth.login.description}
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

