'use client';

/**
 * Tests list component
 * Displays test results with filters and export functionality
 */

import { useState, useEffect } from 'react';
import { TestResultResponse, User } from '@/src/types/api.types';
import { get } from '@/src/lib/api-client';

interface TestsListProps {
  initialTestResults: TestResultResponse[];
  initialTotal?: number;
  initialDoctors: User[];
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
 * Helper to get year of birth from ISO date string
 */
const getYearOfBirth = (isoString: string) => {
  const date = new Date(isoString);
  return date.getFullYear();
};

export default function TestsList({ initialTestResults, initialTotal, initialDoctors }: TestsListProps) {
  const [testResults, setTestResults] = useState<TestResultResponse[]>(initialTestResults);
  const [total, setTotal] = useState(initialTotal ?? initialTestResults.length);
  const [doctors, setDoctors] = useState<User[]>(initialDoctors);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters (apply to both table and export)
  const [filterCity, setFilterCity] = useState('');
  const [filterDoctorId, setFilterDoctorId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCity, filterDoctorId, filterStartDate, filterEndDate]);

  // Fetch test results when filters or pagination change
  useEffect(() => {
    const fetchTestResults = async () => {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (filterCity.trim()) params.append('city', filterCity.trim());
        if (filterDoctorId) params.append('doctorId', filterDoctorId);
        if (filterStartDate) params.append('startDate', new Date(filterStartDate).toISOString());
        if (filterEndDate) params.append('endDate', new Date(filterEndDate + 'T23:59:59').toISOString());
        params.append('limit', pageSize.toString());
        params.append('offset', ((currentPage - 1) * pageSize).toString());

        // Always use filters to get paginated response, even if filters are empty
        // This ensures we always get { results, total } format
        const response = await get<{ results: TestResultResponse[]; total: number } | TestResultResponse[]>(
          `/test-results?${params.toString()}`,
        );

        if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            // Fallback: array response (no filters, old format)
            setTestResults(response.data);
            setTotal(response.data.length);
          } else if ('results' in response.data && 'total' in response.data) {
            // Paginated response with filters
            setTestResults(response.data.results);
            setTotal(response.data.total);
          } else {
            setError('Neočekávaný formát odpovědi ze serveru');
          }
        } else {
          setError(response.error?.message || 'Nepodařilo se načíst výsledky testů');
        }
      } catch (err: any) {
        setError(err.message || 'Nepodařilo se načíst výsledky testů');
      } finally {
        setLoading(false);
      }
    };

    fetchTestResults();
  }, [filterCity, filterDoctorId, filterStartDate, filterEndDate, currentPage, pageSize]);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await get<User[]>('/users');
        if (response.success && response.data) {
          setDoctors(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
      }
    };

    fetchDoctors();
  }, []);

  const handleExport = async () => {
    setExportLoading(true);
    setExportError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filterCity.trim()) queryParams.append('city', filterCity.trim());
      if (filterDoctorId) queryParams.append('doctorId', filterDoctorId);
      if (filterStartDate) queryParams.append('startDate', new Date(filterStartDate).toISOString());
      if (filterEndDate) queryParams.append('endDate', new Date(filterEndDate + 'T23:59:59').toISOString());

      const response = await fetch(`/api/exports/test-results/admin?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Export selhal');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition') || '';
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'test-results.csv';

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Don't reset filters - keep them so user can see what was exported
    } catch (err: any) {
      setExportError(err.message || 'Export selhal');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filters Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
          <button
            onClick={() => {
              setFilterCity('');
              setFilterDoctorId('');
              setFilterStartDate('');
              setFilterEndDate('');
              setCurrentPage(1);
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Vymazat filtry
          </button>
        </div>

        {exportError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {exportError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label htmlFor="filter-city" className="block text-sm font-medium text-gray-700 mb-1">
              Město
            </label>
            <input
              id="filter-city"
              type="text"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              placeholder="Filtrovat podle města..."
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="filter-doctor" className="block text-sm font-medium text-gray-700 mb-1">
              Doktor
            </label>
            <select
              id="filter-doctor"
              value={filterDoctorId}
              onChange={(e) => setFilterDoctorId(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Všichni doktoři</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.icpNumber || doctor.email || 'Neznámý'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Počáteční datum
            </label>
            <input
              id="filter-start-date"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="filter-end-date" className="block text-sm font-medium text-gray-700 mb-1">
              Koncové datum
            </label>
            <input
              id="filter-end-date"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Zobrazeno: <span className="font-medium">{testResults.length}</span> z{' '}
            <span className="font-medium">{total}</span> výsledků
            {total > pageSize && (
              <span className="ml-2">
                (strana {currentPage} z {Math.ceil(total / pageSize)})
              </span>
            )}
          </p>
          <button
            onClick={handleExport}
            disabled={exportLoading || total === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {exportLoading ? 'Exportuji...' : 'Stáhnout CSV (všechny výsledky)'}
          </button>
        </div>
      </div>

      {/* Test Results Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Načítání...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Datum vytvoření
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Doktor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Typ testu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Patogen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pacient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ročník narození
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Město
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {testResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    {loading ? 'Načítání...' : 'Žádné výsledky testů'}
                  </td>
                </tr>
              ) : (
                testResults.map((result) => {
                  const doctor = doctors.find((d) => d.id === result.createdBy);
                  return (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatDateTime(result.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {doctor?.icpNumber || doctor?.email || 'Neznámý'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {result.testTypeName || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {result.pathogenName || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {result.patientIdentifier || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {getYearOfBirth(result.dateOfBirth)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {result.city}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <nav
          className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow"
          aria-label="Pagination"
        >
          <div className="flex-1 flex justify-between sm:justify-end">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Předchozí
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(total / pageSize), prev + 1))}
              disabled={currentPage >= Math.ceil(total / pageSize) || loading}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Další
            </button>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Strana <span className="font-medium">{currentPage}</span> z{' '}
              <span className="font-medium">{Math.ceil(total / pageSize)}</span>
              {' '}(celkem <span className="font-medium">{total}</span> výsledků)
            </p>
          </div>
        </nav>
      )}
    </div>
  );
}

