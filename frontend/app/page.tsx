import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TestResultForm from '@/src/components/TestResultForm';
import Header from '@/src/components/Header';
import AuthSection from '@/src/components/AuthSection';
import { backendGet } from '@/src/lib/backend-client';
import { getDefaultLanguage, getTranslations } from '@/src/lib/translations';
import { isUserToken, isValidToken } from '@/src/lib/jwt';
import { validateLinkToken } from '@/src/lib/token-validator';
import {
  ApiResponse,
  TestType,
  Vaccination,
  CommonSymptom,
  DoctorProfileResponse,
} from '@/src/types/api.types';

/**
 * Main form page
 * Shows test result form with authentication options
 * Supports authentication via:
 * - JWT token (from cookie, for logged-in users)
 * - Unique link token (from URL query parameter, for passwordless users)
 * Prevents admin users from accessing doctor portal
 */
type SearchParams =
  | { token?: string }
  | Promise<{ token?: string }>;

export default async function HomePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolvedSearchParams =
    typeof (searchParams as Promise<{ token?: string }>)?.then === 'function'
      ? await (searchParams as Promise<{ token?: string }>)
      : ((searchParams as { token?: string }) ?? undefined);
  const cookieStore = await cookies();
  const jwtToken = cookieStore.get('auth_token')?.value;
  
  // Extract unique link token from URL if present
  const linkToken = resolvedSearchParams?.token ?? null;
  
  // If JWT token exists but is invalid, redirect to login
  if (jwtToken && !isValidToken(jwtToken)) {
    // Invalid token - redirect to login with error
    redirect('/login?error=invalid_token');
  }
  
  // If logged in with valid JWT, check if user is a doctor (not admin)
  if (jwtToken && isValidToken(jwtToken) && !isUserToken(jwtToken)) {
    // Admin user trying to access doctor portal - redirect to login with error
    redirect('/login?error=admin_detected');
  }
  
  // If link token is provided (and no JWT), validate it before allowing access
  if (linkToken && !jwtToken) {
    const validation = await validateLinkToken(linkToken);
    if (!validation.valid) {
      // Invalid, pending, or rejected token - redirect to login with appropriate error
      redirect(`/login?error=${validation.error || 'invalid_token'}`);
    }
  }
  
  // If logged in with JWT, mark as authenticated
  const isAuthenticated = !!jwtToken;

  // Get language from cookie or use default
  const languageCookie = cookieStore.get('language')?.value;
  const language = (languageCookie as 'cs-CZ' | 'en-US') || getDefaultLanguage();
  const t = getTranslations(language);

  // Fetch dropdown data
  let testTypes: TestType[] = [];
  let vaccinations: Vaccination[] = [];
  let commonSymptoms: CommonSymptom[] = [];
  let profile: DoctorProfileResponse | null = null;

  try {
    const languageParam = `?language=${encodeURIComponent(language)}`;
    const [testTypesRes, vaccinationsRes, symptomsRes] = await Promise.all([
      backendGet<ApiResponse<TestType[]>>(`/api/test-types${languageParam}`),
      backendGet<ApiResponse<Vaccination[]>>(`/api/vaccinations${languageParam}`),
      backendGet<ApiResponse<CommonSymptom[]>>(`/api/common-symptoms${languageParam}`),
    ]);

    if (testTypesRes.success && testTypesRes.data) {
      testTypes = testTypesRes.data;
    }
    if (vaccinationsRes.success && vaccinationsRes.data) {
      vaccinations = vaccinationsRes.data;
    }
    if (symptomsRes.success && symptomsRes.data) {
      commonSymptoms = symptomsRes.data;
    }
    if (jwtToken || linkToken) {
      try {
        const profileRes = await backendGet<ApiResponse<DoctorProfileResponse>>(
          `/api/auth/profile${linkToken && !jwtToken ? `?token=${linkToken}` : ''}`,
          jwtToken || undefined,
          linkToken && !jwtToken ? { 'x-link-token': linkToken } : {},
        );
        if (profileRes.success && profileRes.data) {
          profile = profileRes.data;
        }
      } catch (profileError) {
        console.error('Failed to fetch doctor profile:', profileError);
      }
    }
  } catch (error) {
    console.error('Failed to fetch dropdown data:', error);
  }

  const showForm = isAuthenticated || !!linkToken;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header linkToken={linkToken} isAuthenticated={isAuthenticated} />

      {/* Main Content */}
      <main className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {showForm ? (
          <div className="mx-auto w-full max-w-4xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              {t.header.title}
            </h1>
            <TestResultForm
              linkToken={linkToken}
              isAuthenticated={isAuthenticated}
              profileCityId={profile?.cityId || null}
              profileIcpNumber={profile?.icpNumber || null}
              testTypes={testTypes}
              vaccinations={vaccinations}
              commonSymptoms={commonSymptoms}
            />
          </div>
        ) : (
          <AuthSection />
        )}
      </main>
    </div>
  );
}

