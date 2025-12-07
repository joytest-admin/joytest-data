/**
 * Feedback management page
 * Displays and manages feedback entries from doctors
 */

import { cookies } from 'next/headers';
import { backendGet } from '@/src/lib/backend-client';
import { FeedbackResponse } from '@/src/types/api.types';
import FeedbackList from '@/src/components/FeedbackList';

export default async function FeedbackPage() {
  let feedback: FeedbackResponse[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    // Read token from cookies (server-side)
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      error = 'Neautorizováno - prosím přihlaste se';
    } else {
      // Call backend directly from server-side
      const response = await backendGet<{ success: boolean; data: { results: FeedbackResponse[]; total: number } }>(
        '/api/feedback',
        token,
      );
      if (response.success && response.data) {
        feedback = response.data.results;
        total = response.data.total;
      }
    }
  } catch (err: any) {
    error = err.message || 'Nepodařilo se načíst zpětnou vazbu';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Správa zpětné vazby</h1>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : (
        <FeedbackList initialFeedback={feedback} initialTotal={total} />
      )}
    </div>
  );
}

