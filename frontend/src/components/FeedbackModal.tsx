'use client';

import { useState, useEffect } from 'react';
import { apiPost } from '@/src/lib/api-client';
import { ApiResponse, FeedbackResponse, CreateFeedbackRequest, FeedbackCategory } from '@/src/types/api.types';
import { useTranslation } from '@/src/contexts/TranslationContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  linkToken?: string | null;
  contextUrl?: string | null; // Optional context URL (e.g., current page)
}

/**
 * Modal component for creating feedback
 * Can be used from multiple places (feedback list, settings, form success/error)
 */
export default function FeedbackModal({
  isOpen,
  onClose,
  onSuccess,
  linkToken,
  contextUrl,
}: FeedbackModalProps) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<FeedbackCategory>('question');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCategory('question');
      setSubject('');
      setMessage('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    if (!subject.trim()) {
      setError(t.pages.feedback.modal.subjectRequiredError);
      setLoading(false);
      return;
    }

    if (!message.trim()) {
      setError(t.pages.feedback.modal.messageRequiredError);
      setLoading(false);
      return;
    }

    try {
      // Only include contextUrl if it's a valid non-empty string
      const payload: CreateFeedbackRequest = {
        category,
        subject: subject.trim(),
        message: message.trim(),
        ...(contextUrl && contextUrl.trim() ? { contextUrl: contextUrl.trim() } : {}),
      };

      const queryParams = linkToken ? `?token=${linkToken}` : '';
      const response = await apiPost<ApiResponse<FeedbackResponse>>(
        `/feedback${queryParams}`,
        payload,
      );

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          if (onSuccess) {
            onSuccess();
          }
        }, 1500);
      } else {
        setError(response.error?.message || t.pages.feedback.modal.submitError);
      }
    } catch (err: any) {
      setError(err.message || t.pages.feedback.modal.submitError);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">{t.pages.feedback.modal.close}</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4" id="modal-title">
                {t.pages.feedback.modal.title}
              </h3>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
                  {t.pages.feedback.modal.submitSuccess}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.pages.feedback.modal.categoryRequired}
                  </label>
                  <select
                    id="category"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  >
                    <option value="bug">{t.pages.feedback.categoryBug}</option>
                    <option value="feature_request">{t.pages.feedback.categoryFeatureRequest}</option>
                    <option value="question">{t.pages.feedback.categoryQuestion}</option>
                    <option value="other">{t.pages.feedback.categoryOther}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.pages.feedback.modal.subjectRequired}
                  </label>
                  <input
                    id="subject"
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={255}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    placeholder={t.pages.feedback.modal.subjectPlaceholder}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t.pages.feedback.modal.messageRequired}
                  </label>
                  <textarea
                    id="message"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.pages.feedback.modal.messagePlaceholder}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
                  >
                    {t.pages.feedback.modal.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || success}
                    className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    {loading ? t.pages.feedback.modal.submitting : success ? t.pages.feedback.modal.submitted : t.pages.feedback.modal.submit}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

