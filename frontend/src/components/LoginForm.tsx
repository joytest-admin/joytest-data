'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/src/lib/api-client';
import { LoginRequest, ApiResponse, AuthResponse } from '@/src/types/api.types';
import { useTranslation } from '@/src/contexts/TranslationContext';

/**
 * Login form component for doctors
 */
export default function LoginForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiPost<ApiResponse<AuthResponse>>('/auth/login', {
        email,
        password,
      } as LoginRequest);

      if (response.success) {
        // Redirect to form page
        router.push('/');
        router.refresh();
      } else {
        // Map backend error messages to translations
        const errorMessage = response.error?.message || '';
        if (errorMessage.toLowerCase().includes('invalid credentials')) {
          setError(t.auth.login.invalidCredentials);
        } else {
          setError(errorMessage || t.auth.login.loginFailed);
        }
      }
    } catch (err: any) {
      // Map backend error messages to translations
      const errorMessage = err.message || '';
      if (errorMessage.toLowerCase().includes('invalid credentials')) {
        setError(t.auth.login.invalidCredentials);
      } else {
        setError(errorMessage || t.auth.login.loginFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if error is related to invalid credentials
  const isInvalidCredentials = error && (
    error.toLowerCase().includes('invalid credentials') ||
    error === t.auth.login.invalidCredentials
  );

  return (
    <form onSubmit={handleSubmit} className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm sm:text-base">
          <div className="font-semibold mb-2">{error}</div>
          {isInvalidCredentials && (
            <div className="mt-2 text-sm">
              <p className="mb-1">{t.auth.login.invalidCredentialsContact}</p>
              <p className="mb-1">
                <a href={`mailto:${t.auth.login.contactEmail}`} className="underline hover:text-red-800">
                  {t.auth.login.contactEmail}
                </a>
              </p>
              <p>
                <a href={`tel:${t.auth.login.contactPhone.replace(/\s/g, '')}`} className="underline hover:text-red-800">
                  {t.auth.login.contactPhone}
                </a>
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
            {t.auth.login.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            placeholder="vas@email.cz"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
            {t.auth.login.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 sm:py-2.5 px-4 border border-transparent rounded-md shadow-sm text-base sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
        >
          {loading ? t.auth.login.submitting : t.auth.login.submit}
        </button>
      </div>
    </form>
  );
}

