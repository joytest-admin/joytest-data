/**
 * Vaccinations management page
 * Displays and manages vaccinations
 */

import { cookies } from 'next/headers';
import { backendGet } from '@/src/lib/backend-client';
import { Vaccination } from '@/src/types/api.types';
import VaccinationsList from '@/src/components/VaccinationsList';

export default async function VaccinationsPage() {
  let vaccinations: Vaccination[] = [];
  let error: string | null = null;

  try {
    // Read token from cookies (server-side)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      error = 'Neautorizováno - prosím přihlaste se';
    } else {
      // Call backend directly from server-side
      const response = await backendGet<{ success: boolean; data: Vaccination[] }>(
        '/api/vaccinations',
        token,
      );
      if (response.success && response.data) {
        vaccinations = response.data;
      }
    }
  } catch (err: any) {
    error = err.message || 'Nepodařilo se načíst typy vakcín';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Typy vakcín</h1>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : (
        <VaccinationsList initialVaccinations={vaccinations} />
      )}
    </div>
  );
}

