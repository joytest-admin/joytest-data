/**
 * Translations management page
 * Displays and manages translations for all entities
 */

import { cookies } from 'next/headers';
import { backendGet } from '@/src/lib/backend-client';
import { Translation } from '@/src/types/api.types';
import TranslationsList from '@/src/components/TranslationsList';

export default async function TranslationsPage() {
  let translations: Translation[] = [];
  let error: string | null = null;

  try {
    // Read token from cookies (server-side)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      error = 'Neautorizováno - prosím přihlaste se';
    } else {
      // Call backend directly from server-side
      const response = await backendGet<{ success: boolean; data: Translation[] }>(
        '/api/translations',
        token,
      );
      if (response.success && response.data) {
        translations = response.data;
      }
    }
  } catch (err: any) {
    error = err.message || 'Nepodařilo se načíst překlady';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Překlady</h1>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : (
        <TranslationsList initialTranslations={translations} />
      )}
    </div>
  );
}

