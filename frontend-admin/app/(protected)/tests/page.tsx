/**
 * Tests management page
 * Displays test results with filters and export functionality
 */

import { cookies } from 'next/headers';
import { backendGet } from '@/src/lib/backend-client';
import { TestResultResponse, User } from '@/src/types/api.types';
import TestsList from '@/src/components/TestsList';

export default async function TestsPage() {
  let testResults: TestResultResponse[] = [];
  let total = 0;
  let doctors: User[] = [];
  let error: string | null = null;

  try {
    // Read token from cookies (server-side)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      error = 'Neautorizováno - prosím přihlaste se';
    } else {
      // Fetch test results and doctors in parallel
      // Use limit/offset for initial load
      const [testResultsRes, doctorsRes] = await Promise.all([
        backendGet<{ success: boolean; data: TestResultResponse[] | { results: TestResultResponse[]; total: number } }>(
          '/api/test-results?limit=20&offset=0',
          token,
        ),
        backendGet<{ success: boolean; data: User[] }>(
          '/api/auth/users',
          token,
        ),
      ]);

      if (testResultsRes.success && testResultsRes.data) {
        // Handle both response formats (array or paginated object)
        if (Array.isArray(testResultsRes.data)) {
          testResults = testResultsRes.data;
          total = testResultsRes.data.length;
        } else if ('results' in testResultsRes.data && 'total' in testResultsRes.data) {
          testResults = testResultsRes.data.results;
          total = testResultsRes.data.total;
        }
      }

      if (doctorsRes.success && doctorsRes.data) {
        doctors = doctorsRes.data;
      }
    }
  } catch (err: any) {
    error = err.message || 'Nepodařilo se načíst výsledky testů';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Testy</h1>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : (
        <TestsList initialTestResults={testResults} initialTotal={total} initialDoctors={doctors} />
      )}
    </div>
  );
}
