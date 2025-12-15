'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ApiResponse, TestResultResponse, Patient } from '@/src/types/api.types';
import Link from 'next/link';
import PatientSearch from '@/src/components/PatientSearch';
import Header from '@/src/components/Header';
import { useTranslation } from '@/src/contexts/TranslationContext';
import PositiveNegativeChart from '@/src/components/PositiveNegativeChart';
import PositiveByAgeGroupsChart from '@/src/components/PositiveByAgeGroupsChart';
import PositiveByPathogensChart from '@/src/components/PositiveByPathogensChart';
import PositiveTrendsChart from '@/src/components/PositiveTrendsChart';
import PathogenDistributionChart from '@/src/components/PathogenDistributionChart';
import PathogensByAgeGroupsChart from '@/src/components/PathogensByAgeGroupsChart';
import { getPositiveNegativeStatistics, getPositiveByAgeGroupsStatistics, getPositiveByPathogensStatistics, getPositiveTrendsByPathogensStatistics, getPathogenDistributionByScope, getPathogensByAgeGroupsStatistics, getCityById } from '@/src/lib/api-client';
import { apiGet } from '@/src/lib/api-client';
import { DoctorProfileResponse } from '@/src/types/api.types';
import { useTokenValidation } from '@/src/lib/use-token-validation';

type SortBy = 'created_at' | 'date_of_birth' | 'city' | 'test_type_name' | 'pathogen_name' | 'patient_identifier';
type SortOrder = 'asc' | 'desc';

interface TestResultsData {
  results: TestResultResponse[];
  total: number;
}

/**
 * Test results page for doctors
 * Shows paginated, searchable, and sortable list of test results
 */
function TestsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkToken = searchParams.get('token');
  const { t } = useTranslation();

  // Validate link token early - redirects if invalid
  useTokenValidation(linkToken, false);

  const [testResults, setTestResults] = useState<TestResultResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filterCity, setFilterCity] = useState('');
  
  // Helper function to get first and last day of current month
  // Formats dates in local timezone to avoid timezone conversion issues
  const getCurrentMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Format dates in local timezone (YYYY-MM-DD)
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      start: formatLocalDate(firstDay),
      end: formatLocalDate(lastDay),
    };
  };
  
  const currentMonth = getCurrentMonthRange();
  const [filterStartDate, setFilterStartDate] = useState(searchParams.get('startDate') || currentMonth.start);
  const [filterEndDate, setFilterEndDate] = useState(searchParams.get('endDate') || currentMonth.end);
  const [sortBy, setSortBy] = useState<SortBy>((searchParams.get('sortBy') as SortBy) || 'created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>((searchParams.get('sortOrder') as SortOrder) || 'desc');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [pageSize] = useState(10);

  // Export state
  const [exportType, setExportType] = useState<'interval' | 'patient' | null>(null);
  const [exportPatientId, setExportPatientId] = useState<string | null>(null);
  const [exportPatient, setExportPatient] = useState<Patient | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Statistics state
  const [statistics, setStatistics] = useState<{ positive: number; negative: number } | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);

  // Age groups statistics state
  const [ageGroupsStatistics, setAgeGroupsStatistics] = useState<{
    age0to5: number;
    age6to14: number;
    age15to24: number;
    age25to64: number;
    age65plus: number;
  } | null>(null);
  const [ageGroupsLoading, setAgeGroupsLoading] = useState(false);
  const [ageGroupsError, setAgeGroupsError] = useState<string | null>(null);

  // Pathogens statistics state
  const [pathogensStatistics, setPathogensStatistics] = useState<Array<{ pathogenName: string; count: number }>>([]);
  const [pathogensLoading, setPathogensLoading] = useState(false);
  const [pathogensError, setPathogensError] = useState<string | null>(null);

  // Trends statistics state
  const [trendsStatistics, setTrendsStatistics] = useState<{
    byPathogen: Array<{ date: string; pathogenName: string; count: number }>;
    total: Array<{ date: string; count: number }>;
  }>({ byPathogen: [], total: [] });
  const [trendsPeriod, setTrendsPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [trendsAllDoctors, setTrendsAllDoctors] = useState(false);
  const [trendsRegionId, setTrendsRegionId] = useState<number | null>(null);
  const [trendsCityId, setTrendsCityId] = useState<number | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  // Pathogen distribution statistics state
  const [distributionStatistics, setDistributionStatistics] = useState<{
    me: Array<{ pathogenName: string; count: number; percentage: number }>;
    district: Array<{ pathogenName: string; count: number; percentage: number }>;
    region: Array<{ pathogenName: string; count: number; percentage: number }>;
    country: Array<{ pathogenName: string; count: number; percentage: number }>;
  }>({ me: [], district: [], region: [], country: [] });
  const [distributionRegionId, setDistributionRegionId] = useState<number | null>(null);
  const [distributionCityId, setDistributionCityId] = useState<number | null>(null);
  const [distributionLoading, setDistributionLoading] = useState(false);
  const [distributionError, setDistributionError] = useState<string | null>(null);

  // Pathogens by age groups statistics state
  const [pathogensByAgeGroupsStatistics, setPathogensByAgeGroupsStatistics] = useState<
    Array<{ pathogenName: string; ageGroup: string; count: number }>
  >([]);
  const [pathogensByAgeGroupsLoading, setPathogensByAgeGroupsLoading] = useState(false);
  const [pathogensByAgeGroupsError, setPathogensByAgeGroupsError] = useState<string | null>(null);

  // Fetch doctor profile and set initial region/city filters
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        // Build URL with token if using link token
        const profileUrl = linkToken ? `/auth/profile?token=${linkToken}` : '/auth/profile';
        // Fetch doctor profile to get cityId
        const profileResponse = await apiGet<ApiResponse<DoctorProfileResponse>>(profileUrl);
        if (profileResponse.success && profileResponse.data?.cityId) {
          // Fetch city with full hierarchy to get region ID
          const city = await getCityById(profileResponse.data.cityId);
          if (city?.district?.region) {
            setDistributionRegionId(city.district.region.id);
            setDistributionCityId(city.id);
          }
        }
      } catch (error) {
        // Silently fail - user might not be authenticated or might not have location set
        console.error('Failed to fetch doctor profile for initial filters:', error);
      }
    };

    fetchDoctorProfile();
  }, []);

  // Fetch test results
  useEffect(() => {
    const fetchTestResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (search.trim()) queryParams.append('search', search.trim());
        if (filterCity.trim()) queryParams.append('city', filterCity.trim());
        if (filterStartDate) queryParams.append('startDate', new Date(filterStartDate).toISOString());
        if (filterEndDate) queryParams.append('endDate', new Date(filterEndDate + 'T23:59:59').toISOString());
        queryParams.append('sortBy', sortBy);
        queryParams.append('sortOrder', sortOrder);
        queryParams.append('limit', pageSize.toString());
        queryParams.append('offset', ((currentPage - 1) * pageSize).toString());
        if (linkToken) queryParams.append('token', linkToken);

        const response = await apiGet<ApiResponse<TestResultsData>>(
          `/test-results/my?${queryParams.toString()}`,
        );

        if (response.success && response.data) {
          setTestResults(response.data.results);
          setTotal(response.data.total);
        } else {
          setError(response.error?.message || t.pages.testResults.loading);
        }
      } catch (err: any) {
        setError(err.message || t.pages.testResults.loading);
      } finally {
        setLoading(false);
      }
    };

    fetchTestResults();
  }, [search, filterCity, filterStartDate, filterEndDate, sortBy, sortOrder, currentPage, pageSize, linkToken]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCity, filterStartDate, filterEndDate]);

  // Fetch statistics when filters change
  useEffect(() => {
    const fetchStatistics = async () => {
      setStatisticsLoading(true);
      setStatisticsError(null);

      try {
        const stats = await getPositiveNegativeStatistics(
          {
            search: search.trim() || undefined,
            city: filterCity.trim() || undefined,
            startDate: filterStartDate || undefined,
            endDate: filterEndDate || undefined,
          },
          linkToken || null,
        );
        setStatistics(stats);
      } catch (err: any) {
        setStatisticsError(err.message || 'Failed to load statistics');
        // Don't block the UI if statistics fail
        console.error('Error fetching statistics:', err);
      } finally {
        setStatisticsLoading(false);
      }
    };

    fetchStatistics();
  }, [search, filterCity, filterStartDate, filterEndDate, linkToken]);

  // Fetch age groups statistics when filters change
  useEffect(() => {
    const fetchAgeGroupsStatistics = async () => {
      setAgeGroupsLoading(true);
      setAgeGroupsError(null);

      try {
        const stats = await getPositiveByAgeGroupsStatistics(
          {
            search: search.trim() || undefined,
            city: filterCity.trim() || undefined,
            startDate: filterStartDate || undefined,
            endDate: filterEndDate || undefined,
          },
          linkToken || null,
        );
        setAgeGroupsStatistics(stats);
      } catch (err: any) {
        setAgeGroupsError(err.message || 'Failed to load age groups statistics');
        // Don't block the UI if statistics fail
        console.error('Error fetching age groups statistics:', err);
      } finally {
        setAgeGroupsLoading(false);
      }
    };

    fetchAgeGroupsStatistics();
  }, [search, filterCity, filterStartDate, filterEndDate, linkToken]);

  // Fetch pathogens statistics when filters change
  useEffect(() => {
    const fetchPathogensStatistics = async () => {
      setPathogensLoading(true);
      setPathogensError(null);

      try {
        const stats = await getPositiveByPathogensStatistics(
          {
            search: search.trim() || undefined,
            city: filterCity.trim() || undefined,
            startDate: filterStartDate || undefined,
            endDate: filterEndDate || undefined,
          },
          linkToken || null,
        );
        setPathogensStatistics(stats);
      } catch (err: any) {
        setPathogensError(err.message || 'Failed to load pathogens statistics');
        // Don't block the UI if statistics fail
        console.error('Error fetching pathogens statistics:', err);
      } finally {
        setPathogensLoading(false);
      }
    };

    fetchPathogensStatistics();
  }, [search, filterCity, filterStartDate, filterEndDate, linkToken]);

  // Fetch trends statistics when filters or period change
  useEffect(() => {
    const fetchTrendsStatistics = async () => {
      setTrendsLoading(true);
      setTrendsError(null);

      try {
        const stats = await getPositiveTrendsByPathogensStatistics(
          {
            search: search.trim() || undefined,
            city: filterCity.trim() || undefined,
            allDoctors: trendsAllDoctors,
            regionId: trendsRegionId,
            cityId: trendsCityId,
            startDate: filterStartDate || undefined,
            endDate: filterEndDate || undefined,
            period: trendsPeriod,
          },
          linkToken || null,
        );
        setTrendsStatistics(stats);
      } catch (err: any) {
        setTrendsError(err.message || 'Failed to load trends statistics');
        // Don't block the UI if statistics fail
        console.error('Error fetching trends statistics:', err);
      } finally {
        setTrendsLoading(false);
      }
    };

    fetchTrendsStatistics();
  }, [search, filterCity, filterStartDate, filterEndDate, trendsPeriod, trendsAllDoctors, trendsRegionId, trendsCityId, linkToken]);

  // Fetch pathogen distribution statistics when date filters or geographic filters change
  useEffect(() => {
    const fetchDistributionStatistics = async () => {
      setDistributionLoading(true);
      setDistributionError(null);

      try {
        const stats = await getPathogenDistributionByScope(
          {
            startDate: filterStartDate || undefined,
            endDate: filterEndDate || undefined,
            regionId: distributionRegionId,
            cityId: distributionCityId,
          },
          linkToken || null,
        );
        setDistributionStatistics(stats);
      } catch (err: any) {
        setDistributionError(err.message || 'Failed to load distribution statistics');
        // Don't block the UI if statistics fail
        console.error('Error fetching distribution statistics:', err);
      } finally {
        setDistributionLoading(false);
      }
    };

    fetchDistributionStatistics();
  }, [filterStartDate, filterEndDate, distributionRegionId, distributionCityId, linkToken]);

  // Fetch pathogens by age groups statistics when filters change
  useEffect(() => {
    const fetchPathogensByAgeGroupsStatistics = async () => {
      setPathogensByAgeGroupsLoading(true);
      setPathogensByAgeGroupsError(null);

      try {
        const stats = await getPathogensByAgeGroupsStatistics(
          {
            search: search.trim() || undefined,
            city: filterCity.trim() || undefined,
            startDate: filterStartDate || undefined,
            endDate: filterEndDate || undefined,
          },
          linkToken || null,
        );
        setPathogensByAgeGroupsStatistics(stats);
      } catch (err: any) {
        setPathogensByAgeGroupsError(err.message || 'Failed to load pathogens by age groups statistics');
        // Don't block the UI if statistics fail
        console.error('Error fetching pathogens by age groups statistics:', err);
      } finally {
        setPathogensByAgeGroupsLoading(false);
      }
    };

    fetchPathogensByAgeGroupsStatistics();
  }, [search, filterCity, filterStartDate, filterEndDate, linkToken]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (sortBy !== 'created_at') params.append('sortBy', sortBy);
    if (sortOrder !== 'desc') params.append('sortOrder', sortOrder);
    if (currentPage !== 1) params.append('page', currentPage.toString());
    if (linkToken) params.append('token', linkToken);

    const newUrl = params.toString() ? `/tests?${params.toString()}` : '/tests';
    router.replace(newUrl, { scroll: false });
  }, [search, sortBy, sortOrder, currentPage, linkToken, router]);

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('cs-CZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getYearOfBirth = (dateOfBirth: string) => {
    return new Date(dateOfBirth).getFullYear();
  };

  const truncateTestType = (testTypeName: string | null | undefined, maxLength: number = 20): string => {
    if (!testTypeName) return '-';
    if (testTypeName.length <= maxLength) return testTypeName;
    return testTypeName.substring(0, maxLength) + '...';
  };

  // Export handler - uses current filters (city and/or dates, or all if no filters)
  const handleExport = async () => {
    setExportLoading(true);
    setExportError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filterCity.trim()) queryParams.append('city', filterCity.trim());
      if (filterStartDate) queryParams.append('startDate', new Date(filterStartDate).toISOString());
      if (filterEndDate) queryParams.append('endDate', new Date(filterEndDate + 'T23:59:59').toISOString());
      if (linkToken) queryParams.append('token', linkToken);

      // Use interval export endpoint with filters
      const response = await fetch(`/api/exports/test-results/by-interval?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || t.pages.testResults.exporting);
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
    } catch (err: any) {
      setExportError(err.message || t.pages.testResults.exporting);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportByPatient = async () => {
    if (!exportPatientId) {
      setExportError(t.pages.testResults.selectPatient);
      return;
    }

    setExportLoading(true);
    setExportError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('patientId', exportPatientId);
      if (linkToken) queryParams.append('token', linkToken);

      const response = await fetch(`/api/exports/test-results/by-patient?${queryParams.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || t.pages.testResults.exporting);
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
    } catch (err: any) {
      setExportError(err.message || t.pages.testResults.exporting);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header linkToken={linkToken} isAuthenticated={true} />

      <main className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="mx-auto w-full max-w-7xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            {t.pages.testResults.title}
          </h1>
          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t.pages.testResults.filters}</h2>
              <button
                onClick={() => {
                  setSearch('');
                  setFilterCity('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setCurrentPage(1);
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t.pages.testResults.clearFilters}
              </button>
            </div>

            {exportError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {exportError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.pages.testResults.search}
                </label>
                <input
                  id="search"
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={t.pages.testResults.searchPlaceholder}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="filter-city" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.pages.testResults.city}
                </label>
                <input
                  id="filter-city"
                  type="text"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  placeholder={t.pages.testResults.cityPlaceholder}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="filter-start-date" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.pages.testResults.startDate}
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
                  {t.pages.testResults.endDate}
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
                {t.pages.testResults.showing} <span className="font-medium">{testResults.length}</span> {t.pages.testResults.of}{' '}
                <span className="font-medium">{total}</span> {t.pages.testResults.results}
                {total > pageSize && (
                  <span className="ml-2">
                    ({t.pages.testResults.page} {currentPage} {t.pages.testResults.ofPages} {Math.ceil(total / pageSize)})
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  disabled={exportLoading || total === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {exportLoading ? t.pages.testResults.exporting : t.pages.testResults.exportAll}
                </button>
                <button
                  onClick={() => {
                    setExportType(exportType === 'patient' ? null : 'patient');
                    setExportError(null);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md border ${
                    exportType === 'patient'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t.pages.testResults.exportByPatient}
                </button>
              </div>
            </div>

            {/* Export by Patient Form */}
            {exportType === 'patient' && (
              <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900 mb-3">{t.pages.testResults.exportByPatientTitle}</h3>
                <div className="mb-4">
                  <PatientSearch
                    value={exportPatientId}
                    onChange={(id, patient) => {
                      setExportPatientId(id);
                      setExportPatient(patient);
                    }}
                    linkToken={linkToken}
                  />
                </div>
                <button
                  onClick={handleExportByPatient}
                  disabled={exportLoading || !exportPatientId}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {exportLoading ? t.pages.testResults.exporting : t.pages.testResults.downloadCsv}
                </button>
              </div>
            )}
          </div>

          {/* Charts Section - Moved above results */}
          <div className="mt-6 space-y-8">
            {/* Moje výsledky Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Moje výsledky</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <PositiveNegativeChart
                  positive={statistics?.positive || 0}
                  negative={statistics?.negative || 0}
                  loading={statisticsLoading}
                />
                <PositiveByPathogensChart
                  data={pathogensStatistics}
                  loading={pathogensLoading}
                />
                <PositiveByAgeGroupsChart
                  age0to5={ageGroupsStatistics?.age0to5 || 0}
                  age6to14={ageGroupsStatistics?.age6to14 || 0}
                  age15to24={ageGroupsStatistics?.age15to24 || 0}
                  age25to64={ageGroupsStatistics?.age25to64 || 0}
                  age65plus={ageGroupsStatistics?.age65plus || 0}
                  loading={ageGroupsLoading}
                />
              </div>
            </div>

            {/* Celkové výsledky - porovnání s kolegy v ČR a regionu Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Celkové výsledky - porovnání s kolegy v ČR a regionu</h2>
              {/* Trend chart on separate row */}
              <div className="mb-4">
                <PositiveTrendsChart
                  byPathogen={trendsStatistics.byPathogen}
                  total={trendsStatistics.total}
                  period={trendsPeriod}
                  onPeriodChange={setTrendsPeriod}
                  allDoctors={trendsAllDoctors}
                  onAllDoctorsChange={setTrendsAllDoctors}
                  regionId={trendsRegionId}
                  onRegionChange={setTrendsRegionId}
                  cityId={trendsCityId}
                  onCityChange={setTrendsCityId}
                  loading={trendsLoading}
                />
              </div>
              {/* Other charts in grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <PathogensByAgeGroupsChart
                  data={pathogensByAgeGroupsStatistics}
                  loading={pathogensByAgeGroupsLoading}
                />
                <PathogenDistributionChart
                  me={distributionStatistics.me}
                  district={distributionStatistics.district}
                  region={distributionStatistics.region}
                  country={distributionStatistics.country}
                  regionId={distributionRegionId}
                  onRegionChange={setDistributionRegionId}
                  cityId={distributionCityId}
                  onCityChange={setDistributionCityId}
                  loading={distributionLoading}
                />
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              {t.pages.testResults.loading}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : testResults.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              {t.pages.testResults.noResults}
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center gap-1">
                            {t.pages.testResults.dateCreated}
                            {sortBy === 'created_at' && (
                              <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('test_type_name')}
                        >
                          <div className="flex items-center gap-1">
                            {t.pages.testResults.testType}
                            {sortBy === 'test_type_name' && (
                              <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('pathogen_name')}
                        >
                          <div className="flex items-center gap-1">
                            {t.pages.testResults.pathogen}
                            {sortBy === 'pathogen_name' && (
                              <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('patient_identifier')}
                        >
                          <div className="flex items-center gap-1">
                            {t.pages.testResults.patient}
                            {sortBy === 'patient_identifier' && (
                              <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('date_of_birth')}
                        >
                          <div className="flex items-center gap-1">
                            {t.pages.testResults.yearOfBirth}
                            {sortBy === 'date_of_birth' && (
                              <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th
                          className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('city')}
                        >
                          <div className="flex items-center gap-1">
                            {t.pages.testResults.city}
                            {sortBy === 'city' && (
                              <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t.pages.testResults.action}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {testResults.map((result) => {
                        const editUrl = linkToken 
                          ? `/tests/${result.id}/edit?token=${linkToken}` 
                          : `/tests/${result.id}/edit`;
                        return (
                          <tr 
                            key={result.id} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(editUrl)}
                          >
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDateTime(result.createdAt)}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900" title={result.testTypeName || ''}>
                              {truncateTestType(result.testTypeName)}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.pathogenName || '-'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.patientIdentifier || '-'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {getYearOfBirth(result.dateOfBirth)}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.cityName || '-'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(editUrl);
                                }}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {t.pages.testResults.edit}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {total > pageSize && (
                <nav
                  className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow mt-6"
                  aria-label="Pagination"
                >
                  <div className="flex-1 flex justify-between sm:justify-end">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.pages.testResults.previous}
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(total / pageSize), prev + 1))}
                      disabled={currentPage >= Math.ceil(total / pageSize) || loading}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.pages.testResults.next}
                    </button>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm text-gray-700">
                      {t.pages.testResults.page} <span className="font-medium">{currentPage}</span> {t.pages.testResults.ofPages}{' '}
                      <span className="font-medium">{Math.ceil(total / pageSize)}</span>
                      {' '}({t.pages.testResults.total} <span className="font-medium">{total}</span> {t.pages.testResults.results})
                    </p>
                  </div>
                </nav>
              )}
            </>
          )}
      </div>
    </main>
  </div>
  );
}

/**
 * Tests page wrapper with Suspense boundary
 */
export default function TestsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    }>
      <TestsPageContent />
    </Suspense>
  );
}

