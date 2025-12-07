/**
 * Pathogens management page
 * Server component that fetches pathogens and renders the list component
 */

import { cookies } from 'next/headers';
import { backendGet } from '@/src/lib/backend-client';
import { Pathogen } from '@/src/types/api.types';
import PathogensList from '@/src/components/PathogensList';

export default async function PathogensPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return <div>Unauthorized</div>;
  }

  // Fetch pathogens from backend
  const response = await backendGet<{ success: boolean; data: Pathogen[] }>('/api/pathogens', token);
  const pathogens = response.success && response.data ? response.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Správa patogenů</h1>
        <p className="mt-1 text-sm text-gray-600">
          Spravujte patogeny, které mohou být detekovány testy
        </p>
      </div>
      <PathogensList initialPathogens={pathogens} />
    </div>
  );
}

