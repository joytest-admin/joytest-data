/**
 * Doctors management page
 * Displays and manages doctors (users)
 */

import { cookies } from 'next/headers';
import { backendGet } from '@/src/lib/backend-client';
import { User } from '@/src/types/api.types';
import DoctorsList from '@/src/components/DoctorsList';

export default async function DoctorsPage() {
  let users: User[] = [];
  let error: string | null = null;

  try {
    // Read token from cookies (server-side)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      error = 'Neautorizováno - prosím přihlaste se';
    } else {
      // Call backend directly from server-side
      const response = await backendGet<{ success: boolean; data: User[] }>(
        '/api/auth/users',
        token,
      );
      if (response.success && response.data) {
        users = response.data;
      }
    }
  } catch (err: any) {
    error = err.message || 'Nepodařilo se načíst doktory';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Správa doktorů</h1>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : (
        <DoctorsList initialUsers={users} />
      )}
    </div>
  );
}
