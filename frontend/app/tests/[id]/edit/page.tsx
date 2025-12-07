'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet } from '@/src/lib/api-client';
import { ApiResponse, TestResultResponse, TestType, Vaccination, CommonSymptom, DoctorProfileResponse } from '@/src/types/api.types';
import TestResultForm from '@/src/components/TestResultForm';
import Header from '@/src/components/Header';
import { useTranslation } from '@/src/contexts/TranslationContext';

/**
 * Edit test result page for doctors
 * Allows editing an existing test result
 */
export default function EditTestResultPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkToken = searchParams.get('token');
  const testResultId = (params.id as string) || '';
  const { t } = useTranslation();

  const [testResult, setTestResult] = useState<TestResultResponse | null>(null);
  const [profile, setProfile] = useState<DoctorProfileResponse | null>(null);
  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [commonSymptoms, setCommonSymptoms] = useState<CommonSymptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch test result and dropdown data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = linkToken ? `?token=${linkToken}` : '';
        
        // Fetch test result, profile, and dropdown data in parallel
        const [testResultRes, profileRes, testTypesRes, vaccinationsRes, symptomsRes] = await Promise.all([
          apiGet<ApiResponse<TestResultResponse>>(`/test-results/${testResultId}${queryParams}`),
          apiGet<ApiResponse<DoctorProfileResponse>>(`/auth/profile${queryParams}`),
          apiGet<ApiResponse<TestType[]>>('/test-types'),
          apiGet<ApiResponse<Vaccination[]>>('/vaccinations'),
          apiGet<ApiResponse<CommonSymptom[]>>('/common-symptoms'),
        ]);

        if (testResultRes.success && testResultRes.data) {
          setTestResult(testResultRes.data);
        } else {
          setError(testResultRes.error?.message || 'Nepodařilo se načíst výsledek testu');
        }

        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        } else {
          setError('Nepodařilo se načíst profil');
        }

        if (testTypesRes.success && testTypesRes.data) {
          setTestTypes(testTypesRes.data);
        }
        if (vaccinationsRes.success && vaccinationsRes.data) {
          setVaccinations(vaccinationsRes.data);
        }
        if (symptomsRes.success && symptomsRes.data) {
          setCommonSymptoms(symptomsRes.data);
        }
      } catch (err: any) {
        setError(err.message || 'Nepodařilo se načíst data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [testResultId, linkToken]);

  const handleSuccess = () => {
    // Navigate back to tests list after successful update
    const backUrl = linkToken ? `/tests?token=${linkToken}` : '/tests';
    router.push(backUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">Načítání...</div>
        </div>
      </div>
    );
  }

  const backUrl = linkToken ? `/tests?token=${linkToken}` : '/tests';

  if (error || !testResult || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header linkToken={linkToken} isAuthenticated={true} />
        <main className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="mx-auto w-full max-w-4xl">
            <Link
              href={backUrl}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {t.pages.backToList}
            </Link>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error || 'Nepodařilo se načíst data'}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header linkToken={linkToken} isAuthenticated={true} />

      {/* Main Content */}
      <main className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="mx-auto w-full max-w-4xl">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {t.pages.backToList}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Úprava výsledku testu
          </h1>
          <TestResultForm
            linkToken={linkToken}
            isAuthenticated={true}
            profileCityId={profile.cityId || null}
            profileIcpNumber={profile.icpNumber}
            testTypes={testTypes}
            vaccinations={vaccinations}
            commonSymptoms={commonSymptoms}
            initialData={testResult}
            testResultId={testResultId}
            onSuccess={handleSuccess}
          />
        </div>
      </main>
    </div>
  );
}

