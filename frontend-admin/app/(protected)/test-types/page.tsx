/**
 * Test types management page
 * Displays and manages test types
 */

import { cookies } from 'next/headers';
import { backendGet } from '@/src/lib/backend-client';
import { TestType } from '@/src/types/api.types';
import TestTypesList from '@/src/components/TestTypesList';

export default async function TestTypesPage() {
  let testTypes: TestType[] = [];
  let error: string | null = null;

  try {
    // Read token from cookies (server-side)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      error = 'Neautorizováno - prosím přihlaste se';
    } else {
      // Call backend directly from server-side
      const response = await backendGet<{ success: boolean; data: TestType[] }>(
        '/api/test-types',
        token,
      );
      if (response.success && response.data) {
        testTypes = response.data;
      }
    }
  } catch (err: any) {
    error = err.message || 'Nepodařilo se načíst typy testů';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Typy testů</h1>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : (
        <TestTypesList initialTestTypes={testTypes} />
      )}
    </div>
  );
}

