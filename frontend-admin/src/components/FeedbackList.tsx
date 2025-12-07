'use client';

/**
 * Feedback list component
 * Displays and manages feedback entries with status updates
 */

import { useState, useEffect } from 'react';
import { FeedbackResponse, FeedbackStatus, FeedbackCategory } from '@/src/types/api.types';
import { get, put } from '@/src/lib/api-client';

interface FeedbackListProps {
  initialFeedback: FeedbackResponse[];
  initialTotal: number;
}

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

/**
 * Helper to get status label in Czech
 */
const getStatusLabel = (status: FeedbackStatus): string => {
  const labels: Record<FeedbackStatus, string> = {
    new: 'Nový',
    in_progress: 'V řešení',
    resolved: 'Vyřešeno',
    closed: 'Zavřeno',
  };
  return labels[status] || status;
};

/**
 * Helper to get category label in Czech
 */
const getCategoryLabel = (category: FeedbackCategory): string => {
  const labels: Record<FeedbackCategory, string> = {
    bug: 'Chyba',
    feature_request: 'Požadavek na funkci',
    question: 'Dotaz',
    other: 'Jiné',
  };
  return labels[category] || category;
};

export default function FeedbackList({ initialFeedback, initialTotal }: FeedbackListProps) {
  const [feedback, setFeedback] = useState<FeedbackResponse[]>(initialFeedback);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | 'all'>('all');
  const [editingFeedback, setEditingFeedback] = useState<FeedbackResponse | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState<FeedbackStatus>('new');

  // Fetch feedback when filters change
  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (selectedStatus !== 'all') params.append('status', selectedStatus);
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        params.append('limit', '50');
        params.append('offset', '0');

        const response = await get<{ results: FeedbackResponse[]; total: number }>(
          `/feedback?${params.toString()}`,
        );

        if (response.success && response.data) {
          setFeedback(response.data.results);
          setTotal(response.data.total);
        } else {
          setError(response.error?.message || 'Nepodařilo se načíst zpětnou vazbu');
        }
      } catch (err: any) {
        setError(err.message || 'Nepodařilo se načíst zpětnou vazbu');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [selectedStatus, selectedCategory]);

  const handleEdit = (item: FeedbackResponse) => {
    setEditingFeedback(item);
    setAdminResponse(item.adminResponse || '');
    setNewStatus(item.status);
  };

  const handleUpdate = async () => {
    if (!editingFeedback) return;

    setLoading(true);
    setError('');

    try {
      const response = await put<FeedbackResponse>(`/feedback/${editingFeedback.id}`, {
        status: newStatus,
        adminResponse: adminResponse.trim() || null,
      });

      if (response.success && response.data) {
        const updated = response.data;
        setFeedback(feedback.map((f) => (f.id === updated.id ? updated : f)));
        setEditingFeedback(null);
        setAdminResponse('');
      } else {
        setError(response.error?.message || 'Nepodařilo se aktualizovat zpětnou vazbu');
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se aktualizovat zpětnou vazbu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Status:
          </label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as FeedbackStatus | 'all')}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">Všechny</option>
            <option value="new">Nový</option>
            <option value="in_progress">V řešení</option>
            <option value="resolved">Vyřešeno</option>
            <option value="closed">Zavřeno</option>
          </select>
        </div>

        <div>
          <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Kategorie:
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as FeedbackCategory | 'all')}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">Všechny</option>
            <option value="bug">Chyba</option>
            <option value="feature_request">Požadavek na funkci</option>
            <option value="question">Dotaz</option>
            <option value="other">Jiné</option>
          </select>
        </div>

        <div className="flex items-end">
          <span className="text-sm text-gray-600">Celkem: {total}</span>
        </div>
      </div>

      {/* Edit Modal */}
      {editingFeedback && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setEditingFeedback(null)}></div>
            <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Upravit zpětnou vazbu</h3>

              <div className="space-y-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Doktor:</p>
                  <p className="text-sm text-gray-900">
                    {editingFeedback.doctorEmail || editingFeedback.doctorIcpNumber || 'Neznámý'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Předmět:</p>
                  <p className="text-sm text-gray-900">{editingFeedback.subject}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Zpráva:</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{editingFeedback.message}</p>
                </div>

                <div>
                  <label htmlFor="new-status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status:
                  </label>
                  <select
                    id="new-status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as FeedbackStatus)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="new">Nový</option>
                    <option value="in_progress">V řešení</option>
                    <option value="resolved">Vyřešeno</option>
                    <option value="closed">Zavřeno</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="admin-response" className="block text-sm font-medium text-gray-700 mb-1">
                    Odpověď administrátora:
                  </label>
                  <textarea
                    id="admin-response"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Zde můžete napsat odpověď doktorovi..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingFeedback(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Zrušit
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Ukládání...' : 'Uložit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Načítání...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Doktor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Kategorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Předmět
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {feedback.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Žádná zpětná vazba
                  </td>
                </tr>
              ) : (
                feedback.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {item.doctorEmail || item.doctorIcpNumber || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {getCategoryLabel(item.category)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                      {item.subject}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          item.status === 'new'
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : item.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Upravit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

