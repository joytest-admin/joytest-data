/**
 * Common symptoms management page
 * Displays and manages common symptoms
 */

import { cookies } from 'next/headers';
import { backendGet } from '@/src/lib/backend-client';
import { CommonSymptom } from '@/src/types/api.types';
import CommonSymptomsList from '@/src/components/CommonSymptomsList';

export default async function CommonSymptomsPage() {
  let commonSymptoms: CommonSymptom[] = [];
  let error: string | null = null;

  try {
    // Read token from cookies (server-side)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      error = 'Neautorizováno - prosím přihlaste se';
    } else {
      // Call backend directly from server-side
      const response = await backendGet<{ success: boolean; data: CommonSymptom[] }>(
        '/api/common-symptoms',
        token,
      );
      if (response.success && response.data) {
        commonSymptoms = response.data;
      }
    }
  } catch (err: any) {
    error = err.message || 'Nepodařilo se načíst běžné příznaky';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Běžné příznaky</h1>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : (
        <CommonSymptomsList initialCommonSymptoms={commonSymptoms} />
      )}
    </div>
  );
}

