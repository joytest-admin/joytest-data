'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiGet } from '@/src/lib/api-client';
import { ApiResponse, FeedbackResponse } from '@/src/types/api.types';
import { useTranslation } from '@/src/contexts/TranslationContext';
import FeedbackModal from '@/src/components/FeedbackModal';
import Header from '@/src/components/Header';
import Link from 'next/link';

/**
 * Helper to format date and time
 */
const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString('cs-CZ', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Status and category labels will be handled in the component using translations

/**
 * Helper to get status color
 */
const getStatusColor = (status: FeedbackResponse['status']): string => {
  const colors: Record<FeedbackResponse['status'], string> = {
    new: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Category labels will be handled in the component using translations

/**
 * Feedback list page content (needs to be separate to use useSearchParams)
 */
function FeedbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkToken = searchParams.get('token');
  const { t } = useTranslation();

  const getStatusLabel = (status: FeedbackResponse['status']): string => {
    const labels: Record<FeedbackResponse['status'], string> = {
      new: t.pages.feedback.statusNew,
      in_progress: t.pages.feedback.statusInProgress,
      resolved: t.pages.feedback.statusResolved,
      closed: t.pages.feedback.statusClosed,
    };
    return labels[status] || status;
  };

  const getCategoryLabel = (category: FeedbackResponse['category']): string => {
    const labels: Record<FeedbackResponse['category'], string> = {
      bug: t.pages.feedback.categoryBug,
      feature_request: t.pages.feedback.categoryFeatureRequest,
      question: t.pages.feedback.categoryQuestion,
      other: t.pages.feedback.categoryOther,
    };
    return labels[category] || category;
  };

  const [feedbackList, setFeedbackList] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch feedback
  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = linkToken ? `?token=${linkToken}` : '';
        const response = await apiGet<ApiResponse<{ results: FeedbackResponse[]; total: number }>>(
          `/feedback/my${queryParams}`,
        );

        if (response.success && response.data) {
          setFeedbackList(response.data.results);
        } else {
          setError(response.error?.message || t.pages.feedback.loadError);
        }
      } catch (err: any) {
        setError(err.message || t.pages.feedback.loadError);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [linkToken]);

  const handleModalSuccess = () => {
    // Refresh feedback list
    const fetchFeedback = async () => {
      try {
        const queryParams = linkToken ? `?token=${linkToken}` : '';
        const response = await apiGet<ApiResponse<{ results: FeedbackResponse[]; total: number }>>(
          `/feedback/my${queryParams}`,
        );

        if (response.success && response.data) {
          setFeedbackList(response.data.results);
        }
      } catch (err) {
        console.error('Failed to refresh feedback:', err);
      }
    };
    fetchFeedback();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header linkToken={linkToken} isAuthenticated={true} />

      <main className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            {t.pages.feedback.title}
          </h1>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm sm:text-base font-medium min-h-[44px] flex items-center justify-center"
            >
              {t.pages.feedback.newFeedback}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">{t.pages.feedback.loading}</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : feedbackList.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
              <p className="text-gray-600 mb-4">{t.pages.feedback.noFeedback}</p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                {t.pages.feedback.submitFirstFeedback}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackList.map((feedback) => (
                <div
                  key={feedback.id}
                  className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-blue-500"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {feedback.subject}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(feedback.status)}`}
                        >
                          {getStatusLabel(feedback.status)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600">
                        <span className="font-medium">{getCategoryLabel(feedback.category)}</span>
                        <span>•</span>
                        <span>{formatDateTime(feedback.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
                      {feedback.message}
                    </p>
                  </div>

                  {feedback.adminResponse && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">{t.pages.feedback.adminResponse}</span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(feedback.updatedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                        {feedback.adminResponse}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <FeedbackModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
        linkToken={linkToken}
        contextUrl={typeof window !== 'undefined' ? window.location.href : null}
      />
    </div>
  );
}

/**
 * Feedback list page for doctors
 * Wrapped in Suspense to handle useSearchParams
 */
export default function FeedbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    }>
      <FeedbackPageContent />
    </Suspense>
  );
}

