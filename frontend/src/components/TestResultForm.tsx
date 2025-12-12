'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, apiGet, apiPut } from '@/src/lib/api-client';
import { getCities, getCityById } from '@/src/lib/api-client';
import {
  TestType,
  Vaccination,
  CommonSymptom,
  CreateTestResultRequest,
  UpdateTestResultRequest,
  ApiResponse,
  TestResultResponse,
  IdentifyResponse,
  IdentifyByTokenRequest,
  Pathogen,
  Patient,
  CityResponse,
  TestResultVaccinationRequest,
} from '@/src/types/api.types';
import { useTranslation } from '@/src/contexts/TranslationContext';
import PatientSelector from './PatientSelector';
import FeedbackModal from './FeedbackModal';
import VaccinationSelector from './VaccinationSelector';

interface TestResultFormProps {
  linkToken: string | null; // Unique link token from URL
  isAuthenticated: boolean; // Whether user is authenticated via JWT
  profileCityId: number | null; // City ID from doctor's profile for pre-fill
  profileIcpNumber: string | null; // ICP number from doctor's profile
  testTypes: TestType[];
  vaccinations: Vaccination[];
  commonSymptoms: CommonSymptom[];
  initialData?: TestResultResponse; // Optional initial data for edit mode
  testResultId?: string; // Optional test result ID for edit mode
  onSuccess?: () => void; // Optional callback after successful submission
}

/**
 * Test result form component
 * Handles both authenticated (JWT token) and unique link token authentication
 */
export default function TestResultForm({
  linkToken: initialLinkToken,
  isAuthenticated: initialIsAuthenticated,
  profileCityId,
  profileIcpNumber,
  testTypes: initialTestTypes,
  vaccinations: initialVaccinations,
  commonSymptoms: initialCommonSymptoms,
  initialData,
  testResultId,
  onSuccess,
}: TestResultFormProps) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const isEditMode = !!initialData && !!testResultId;
  
  // Helper to extract temperature from symptoms array
  const extractTemperature = (symptoms: string[]): string => {
    const tempSymptom = symptoms.find(s => s.startsWith('Teplota:'));
    if (tempSymptom) {
      const match = tempSymptom.match(/Teplota:\s*([\d.]+)°C/);
      return match ? match[1] : '';
    }
    return '';
  };

  // Helper to extract other symptoms (excluding temperature)
  const extractOtherSymptoms = (symptoms: string[]): string[] => {
    return symptoms.filter(s => !s.startsWith('Teplota:'));
  };

  // Initialize form state from initialData if in edit mode
  const getInitialYearOfBirth = (): string => {
    if (initialData?.dateOfBirth) {
      return new Date(initialData.dateOfBirth).getFullYear().toString();
    }
    return '';
  };

  const getInitialSymptoms = (): string[] => {
    if (initialData?.symptoms) {
      return extractOtherSymptoms(initialData.symptoms);
    }
    return [];
  };

  const getInitialTemperature = (): string => {
    if (initialData?.symptoms) {
      return extractTemperature(initialData.symptoms);
    }
    return '';
  };

  const getInitialTestDate = (): string => {
    if (initialData?.testDate) {
      // Convert testDate to YYYY-MM-DD format for date input
      return new Date(initialData.testDate).toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  // Helper to get last test type from localStorage
  const getLastTestTypeFromStorage = (): string => {
    if (typeof window !== 'undefined') {
      try {
        const lastTestTypeId = localStorage.getItem('lastTestTypeId');
        if (lastTestTypeId) {
          // Verify the test type still exists in available test types
          const testTypeExists = initialTestTypes.some(tt => tt.id === lastTestTypeId);
          if (testTypeExists) {
            return lastTestTypeId;
          }
        }
      } catch (error) {
        // Handle localStorage errors (e.g., quota exceeded, disabled)
        console.warn('Failed to load last test type from localStorage:', error);
      }
    }
    return '';
  };

  // Helper to get last city from localStorage
  const getLastCityFromStorage = async (): Promise<CityResponse | null> => {
    if (typeof window !== 'undefined') {
      try {
        const lastCityId = localStorage.getItem('lastCityId');
        if (lastCityId) {
          // Try to load the city by ID to verify it still exists
          try {
            const city = await getCityById(parseInt(lastCityId, 10));
            if (city) {
              return city;
            }
          } catch (err) {
            // City doesn't exist or failed to load - clear from storage
            localStorage.removeItem('lastCityId');
          }
        }
      } catch (error) {
        // Handle localStorage errors (e.g., quota exceeded, disabled)
        console.warn('Failed to load last city from localStorage:', error);
      }
    }
    return null;
  };

  // Helper to get initial test type (from initialData or localStorage)
  const getInitialTestTypeId = (): string => {
    // Edit mode: always use initialData
    if (initialData?.testTypeId) {
      return initialData.testTypeId;
    }
    
    // New form: try to load from localStorage
    return getLastTestTypeFromStorage();
  };

  // Form state
  const [linkToken, setLinkToken] = useState(initialLinkToken);
  const [testTypeId, setTestTypeId] = useState(getInitialTestTypeId());
  const [result, setResult] = useState(initialData?.pathogenId ? 'positive' : (initialData ? 'negative' : ''));
  const [yearOfBirth, setYearOfBirth] = useState(getInitialYearOfBirth());
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityResponse | null>(null);
  const [citySuggestions, setCitySuggestions] = useState<CityResponse[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [loadingInitialCity, setLoadingInitialCity] = useState(false);
  const [testDate, setTestDate] = useState(getInitialTestDate());
  const [temperature, setTemperature] = useState<string>(getInitialTemperature());
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(getInitialSymptoms());
  const [otherInformations, setOtherInformations] = useState(initialData?.otherInformations || '');
  const [sari, setSari] = useState(initialData?.sari || false);
  const [atb, setAtb] = useState(initialData?.atb || false);
  const [antivirals, setAntivirals] = useState(initialData?.antivirals || false);
  const [obesity, setObesity] = useState(initialData?.obesity || false);
  const [respiratorySupport, setRespiratorySupport] = useState(initialData?.respiratorySupport || false);
  const [ecmo, setEcmo] = useState(initialData?.ecmo || false);
  const [pregnancy, setPregnancy] = useState(initialData?.pregnancy || false);
  const [trimester, setTrimester] = useState<number | null>(initialData?.trimester || null);
  const [vaccinations, setVaccinations] = useState<TestResultVaccinationRequest[]>(() => {
    // Initialize from initialData if in edit mode
    if (initialData?.vaccinations && initialData.vaccinations.length > 0) {
      return initialData.vaccinations.map((v) => ({
        vaccinationId: v.vaccinationId,
        vaccineName: v.vaccineName || undefined,
        batchNumber: v.batchNumber || undefined,
        vaccinationDate: v.vaccinationDate || undefined,
      }));
    }
    return [];
  });
  const [pathogenId, setPathogenId] = useState(initialData?.pathogenId || '');
  const [pathogens, setPathogens] = useState<Pathogen[]>([]);
  const [availablePathogens, setAvailablePathogens] = useState<Pathogen[]>([]);
  const [patientId, setPatientId] = useState<string | null>(initialData?.patientId || null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  const cityInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load initial city from profile, initialData, or localStorage
  useEffect(() => {
    const loadInitialCity = async () => {
      // Priority: initialData > profileCityId > localStorage (for new forms only)
      const cityIdToLoad = initialData?.cityId || profileCityId;
      if (cityIdToLoad) {
        setLoadingInitialCity(true);
        try {
          const city = await getCityById(cityIdToLoad);
          if (city) {
            setSelectedCity(city);
            setCitySearchQuery(city.name);
          }
        } catch (err) {
          console.error('Failed to load initial city:', err);
        } finally {
          setLoadingInitialCity(false);
        }
      } else if (!initialData && !profileCityId) {
        // New form with no profile city: try to load from localStorage
        setLoadingInitialCity(true);
        try {
          const lastCity = await getLastCityFromStorage();
          if (lastCity) {
            setSelectedCity(lastCity);
            setCitySearchQuery(lastCity.name);
          }
        } catch (err) {
          console.error('Failed to load last city from localStorage:', err);
        } finally {
          setLoadingInitialCity(false);
        }
      }
    };
    loadInitialCity();
  }, [initialData?.cityId, profileCityId]);

  // Debounced city search
  useEffect(() => {
    // If query is empty, clear suggestions
    if (!citySearchQuery.trim()) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }

    // If user is typing something different from the selected city, clear selection and show suggestions
    if (selectedCity && citySearchQuery.trim() !== selectedCity.name) {
      setSelectedCity(null);
    }

    // If there's a selected city and the query matches it, don't show suggestions
    if (selectedCity && citySearchQuery.trim() === selectedCity.name) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const cities = await getCities(undefined, citySearchQuery);
        setCitySuggestions(cities);
        setShowCitySuggestions(true);
      } catch (err) {
        console.error('Failed to search cities:', err);
        setCitySuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [citySearchQuery, selectedCity]);


  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(event.target as Node)
      ) {
        setShowCitySuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load all pathogens on mount
  useEffect(() => {
    const loadPathogens = async () => {
      try {
        const languageParam = `?language=${encodeURIComponent(language)}`;
        const response = await apiGet<ApiResponse<Pathogen[]>>(`/pathogens${languageParam}`);
        if (response.success && response.data) {
          setPathogens(response.data);
        }
      } catch (err) {
        console.error('Failed to load pathogens:', err);
      }
    };
    loadPathogens();
  }, [language]);

  // Load patient data if in edit mode and patientId is set
  useEffect(() => {
    const loadPatient = async () => {
      if (isEditMode && initialData?.patientId && !selectedPatient) {
        try {
          const queryParams = linkToken ? `?token=${linkToken}` : '';
          const response = await apiGet<ApiResponse<Patient>>(
            `/patients/my/${initialData.patientId}${queryParams}`,
          );
          if (response.success && response.data) {
            setSelectedPatient(response.data);
          }
        } catch (err) {
          console.error('Failed to load patient:', err);
          // Don't show error - patient might have been deleted, just use the identifier from initialData
          if (initialData?.patientIdentifier) {
            // Create a minimal patient object from the identifier
            setSelectedPatient({
              id: initialData.patientId!,
              doctorId: '',
              identifier: initialData.patientIdentifier,
              note: null,
              yearOfBirth: null,
              createdAt: '',
              updatedAt: '',
            });
          }
        }
      }
    };
    loadPatient();
  }, [isEditMode, initialData?.patientId, initialData?.patientIdentifier, linkToken, selectedPatient]);

  // Filter pathogens based on selected test type
  useEffect(() => {
    if (testTypeId && initialTestTypes.length > 0) {
      const selectedTestType = initialTestTypes.find((tt) => tt.id === testTypeId);
      if (selectedTestType && selectedTestType.pathogenIds) {
        const filtered = pathogens.filter((p) =>
          selectedTestType.pathogenIds!.includes(p.id),
        );
        setAvailablePathogens(filtered);
        // Only reset pathogen selection if pathogens are loaded and current selection is not available
        // Don't reset if pathogens are still loading (empty array) - this prevents race condition in edit mode
        if (pathogens.length > 0 && pathogenId && !filtered.find((p) => p.id === pathogenId)) {
          setPathogenId('');
        }
        // If pathogens are loaded and we have a pathogenId, ensure it's still valid
        // This handles the case where pathogens load after initial mount
      } else {
        setAvailablePathogens([]);
        // Only reset if pathogens are loaded (not still loading) and we have a pathogenId
        // This prevents clearing pathogenId before pathogens are loaded in edit mode
        if (pathogens.length > 0 && pathogenId) {
          setPathogenId('');
        }
      }
    } else {
      setAvailablePathogens([]);
      // Only reset if pathogens are loaded (not still loading) and we have a pathogenId
      // This prevents clearing pathogenId before pathogens are loaded in edit mode
      if (pathogens.length > 0 && pathogenId) {
        setPathogenId('');
      }
    }
  }, [testTypeId, initialTestTypes, pathogens, pathogenId]);

  // Try to identify user by unique link token on mount
  // Note: Server-side validation on main page should catch invalid tokens,
  // but this provides a fallback and sets authentication state
  useEffect(() => {
  const identifyByToken = async () => {
    if (!linkToken || initialIsAuthenticated) {
      // If JWT authenticated or no token, skip
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiPost<ApiResponse<IdentifyResponse>>('/auth/identify-by-token', {
        token: linkToken,
      } as IdentifyByTokenRequest);

      if (response.success && response.data) {
        setIsAuthenticated(true);
        // City part will be loaded from profile if available
        setError(null);
      } else {
        // Invalid token - redirect to login (server-side validation should catch this, but fallback)
        window.location.href = '/login?error=invalid_token';
      }
    } catch (err: any) {
      // Check error message to determine specific issue
      const errorMessage = err.message || '';
      if (errorMessage.includes('schválení') || errorMessage.includes('pending') || errorMessage.includes('rejected')) {
        window.location.href = '/login?error=account_pending';
      } else if (errorMessage.includes('hesla') || errorMessage.includes('password')) {
        window.location.href = '/login?error=password_required';
      } else {
        window.location.href = '/login?error=invalid_token';
      }
    } finally {
      setLoading(false);
    }
  };

  identifyByToken();
}, [linkToken, initialIsAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    // Validation: user must be authenticated (either via JWT or unique link token)
    if (!initialIsAuthenticated && !isAuthenticated) {
      setError(t.form.invalidLinkError);
      setLoading(false);
      return;
    }

    if (!testTypeId) {
      setError(t.form.testTypeRequiredError);
      setLoading(false);
      return;
    }

    if (!result) {
      setError(t.form.resultRequiredError);
      setLoading(false);
      return;
    }

    if (!yearOfBirth) {
      setError(t.form.yearOfBirthRequiredError);
      setLoading(false);
      return;
    }

    if (!selectedCity) {
      setError(t.form.cityRequiredError);
      setLoading(false);
      return;
    }

    if (!testDate) {
      setError(t.form.testDateRequiredError);
      setLoading(false);
      return;
    }

    // If result is positive, pathogen is required
    if (result === 'positive' && !pathogenId) {
      setError(t.form.pathogenRequiredError);
      setLoading(false);
      return;
    }

    // Build symptoms array
    const symptoms: string[] = [];
    if (temperature && temperature.trim() !== '') {
      // Normalize comma to dot for parsing (allow both formats in input)
      const normalizedTemp = temperature.replace(',', '.');
      const tempValue = parseFloat(normalizedTemp);
      if (!isNaN(tempValue) && tempValue >= 35 && tempValue <= 42) {
        symptoms.push(`Teplota: ${tempValue.toFixed(1)}°C`);
      }
    }
    selectedSymptoms.forEach((symptom) => {
      symptoms.push(symptom);
    });
    // Pathogen is now stored separately, not in symptoms
    // Symptoms are now optional - empty array is allowed

    // Convert year of birth to date
    const dateOfBirth = new Date(parseInt(yearOfBirth), 0, 1).toISOString();

    // Validate ICP number is available (only for create mode)
    if (!isEditMode && !profileIcpNumber) {
      setError(t.form.icpNotAvailableError);
      setLoading(false);
      return;
    }

    try {
      let response: ApiResponse<TestResultResponse>;

      if (isEditMode && testResultId) {
        // Update mode
        // Include pathogenId: if result is positive, use the selected pathogenId (already validated), otherwise null to clear it
        const updateRequest: UpdateTestResultRequest = {
          cityId: selectedCity.id,
          testTypeId,
          dateOfBirth,
          testDate: new Date(testDate).toISOString(), // Convert test date to ISO string
          symptoms: symptoms.length > 0 ? symptoms : undefined, // Only include if not empty
          pathogenId: result === 'positive' ? pathogenId : undefined,
          patientId: patientId || undefined,
          otherInformations: otherInformations.trim() || undefined,
          sari: sari || undefined,
          atb: atb || undefined,
          antivirals: antivirals || undefined,
          obesity: obesity || undefined,
          respiratorySupport: respiratorySupport || undefined,
          ecmo: ecmo || undefined,
          pregnancy: pregnancy || undefined,
          trimester: pregnancy && trimester ? trimester : undefined,
          vaccinations: vaccinations.length > 0 ? vaccinations : undefined,
        };

        const queryParams = linkToken ? `?token=${linkToken}` : '';
        response = await apiPut<ApiResponse<TestResultResponse>>(
          `/test-results/${testResultId}${queryParams}`,
          updateRequest,
        );
      } else {
        // Create mode
        const createRequest: CreateTestResultRequest = {
          cityId: selectedCity.id,
          icpNumber: profileIcpNumber || '', // Include ICP number from doctor's profile
          testTypeId,
          dateOfBirth,
          testDate: new Date(testDate).toISOString(), // Convert test date to ISO string
          symptoms: symptoms.length > 0 ? symptoms : undefined, // Only include if not empty
          pathogenId: result === 'positive' ? pathogenId : undefined,
          patientId: patientId || undefined, // Include patient ID if selected
          token: linkToken || undefined, // Include unique link token if present (for passwordless auth)
          otherInformations: otherInformations.trim() || undefined,
          sari: sari || undefined,
          atb: atb || undefined,
          antivirals: antivirals || undefined,
          obesity: obesity || undefined,
          respiratorySupport: respiratorySupport || undefined,
          ecmo: ecmo || undefined,
          pregnancy: pregnancy || undefined,
          trimester: pregnancy && trimester ? trimester : undefined,
          vaccinations: vaccinations.length > 0 ? vaccinations : undefined,
        };

        response = await apiPost<ApiResponse<TestResultResponse>>(
          '/test-results',
          createRequest,
        );
      }

      if (response.success) {
        // Save last selected test type to localStorage (for new forms only)
        if (testTypeId && !isEditMode && typeof window !== 'undefined') {
          try {
            localStorage.setItem('lastTestTypeId', testTypeId);
          } catch (error) {
            // Handle localStorage errors gracefully
            console.warn('Failed to save last test type to localStorage:', error);
          }
        }

        // Save last selected city to localStorage (for new forms only)
        if (selectedCity && !isEditMode && typeof window !== 'undefined') {
          try {
            localStorage.setItem('lastCityId', selectedCity.id.toString());
          } catch (error) {
            // Handle localStorage errors gracefully
            console.warn('Failed to save last city to localStorage:', error);
          }
        }

        // Sync yearOfBirth to patient if patient is selected and doesn't have it
        // This allows creating patient without yearOfBirth, then filling it later when submitting test result
        if (patientId && selectedPatient && yearOfBirth && !selectedPatient.yearOfBirth) {
          try {
            const yearOfBirthNum = parseInt(yearOfBirth, 10);
            if (!isNaN(yearOfBirthNum) && yearOfBirthNum >= 1900 && yearOfBirthNum <= 2100) {
              const queryParams = linkToken ? `?token=${linkToken}` : '';
              const updateResponse = await apiPut<ApiResponse<Patient>>(
                `/patients/my/${patientId}${queryParams}`,
                { yearOfBirth: yearOfBirthNum },
              );
              // Update local patient state if update was successful
              if (updateResponse.success && updateResponse.data) {
                setSelectedPatient(updateResponse.data);
              }
            }
          } catch (updateErr) {
            // Don't fail the whole submission if patient update fails
            // This is a "nice to have" feature - the test result is already saved
            console.error('Failed to update patient yearOfBirth:', updateErr);
          }
        }

        setSuccess(true);
        
        if (isEditMode) {
          // In edit mode, call onSuccess callback if provided, or navigate back
          if (onSuccess) {
            onSuccess();
          } else {
            // Navigate back to tests list
            const backUrl = linkToken ? `/tests?token=${linkToken}` : '/tests';
            router.push(backUrl);
          }
        } else {
          // Reset form only in create mode
          // Reload test type from localStorage (or empty if not available)
          setTestTypeId(getLastTestTypeFromStorage());
          setResult('');
          setYearOfBirth('');
          // Reload city from localStorage (or empty if not available)
          getLastCityFromStorage().then((lastCity) => {
            if (lastCity) {
              setSelectedCity(lastCity);
              setCitySearchQuery(lastCity.name);
            } else {
              setCitySearchQuery('');
              setSelectedCity(null);
            }
          }).catch(() => {
            setCitySearchQuery('');
            setSelectedCity(null);
          });
          setTestDate(new Date().toISOString().split('T')[0]);
          setTemperature('');
          setSelectedSymptoms([]);
          setOtherInformations('');
          setSari(false);
          setAtb(false);
          setAntivirals(false);
          setObesity(false);
          setRespiratorySupport(false);
          setEcmo(false);
          setPregnancy(false);
          setTrimester(null);
          setVaccinations([]);
          setPathogenId('');
          setPatientId(null);
          setSelectedPatient(null);
        }
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(response.error?.message || (isEditMode ? t.form.errorEdit : t.form.error));
      }
    } catch (err: any) {
      setError(err.message || (isEditMode ? t.form.errorEdit : t.form.error));
    } finally {
      setLoading(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  // Handle patient selection - pre-fill year of birth
  const handlePatientChange = (newPatientId: string | null, patient: Patient | null) => {
    setPatientId(newPatientId);
    setSelectedPatient(patient);
    if (patient && patient.yearOfBirth) {
      setYearOfBirth(patient.yearOfBirth.toString());
    } else if (!patient) {
      // Clear year of birth if patient is cleared (but don't clear if user manually entered it)
      // Only clear if it matches the previously selected patient's year
      if (selectedPatient && selectedPatient.yearOfBirth && yearOfBirth === selectedPatient.yearOfBirth.toString()) {
        setYearOfBirth('');
      }
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      {/* Error message */}
      {error && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm sm:text-base">
          <div className="flex items-start justify-between gap-2">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setShowFeedbackModal(true)}
              className="text-red-800 hover:text-red-900 underline text-sm whitespace-nowrap"
            >
              {t.form.sendFeedback}
            </button>
          </div>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm sm:text-base">
          <div className="flex items-start justify-between gap-2">
            <span>{isEditMode ? t.form.successEdit : t.form.success}</span>
            <button
              type="button"
              onClick={() => setShowFeedbackModal(true)}
              className="text-green-800 hover:text-green-900 underline text-sm whitespace-nowrap"
            >
              {t.form.sendFeedback}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Authentication Status */}
        {!initialIsAuthenticated && !isAuthenticated && linkToken && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm sm:text-base">
            {t.form.validating}
          </div>
        )}
        {(isAuthenticated || initialIsAuthenticated) && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm sm:text-base">
            {t.form.authorized}
          </div>
        )}

        {/* Patient Selector - First field */}
        <div className="mb-4 sm:mb-6">
          <PatientSelector
            value={patientId}
            onChange={handlePatientChange}
            linkToken={linkToken}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label htmlFor="testType" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
              {t.form.testTypeRequired}
            </label>
            <select
              id="testType"
              required
              value={testTypeId}
              onChange={(e) => {
                const newTestTypeId = e.target.value;
                setTestTypeId(newTestTypeId);
                // Save to localStorage when user selects a test type
                if (newTestTypeId && typeof window !== 'undefined' && !isEditMode) {
                  try {
                    localStorage.setItem('lastTestTypeId', newTestTypeId);
                  } catch (error) {
                    // Handle localStorage errors gracefully
                    console.warn('Failed to save last test type to localStorage:', error);
                  }
                }
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="">{t.form.selectOption}</option>
              {initialTestTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label htmlFor="result" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
              {t.form.resultRequired}
            </label>
            <select
              id="result"
              required
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="">{t.form.selectOption}</option>
              <option value="positive">{t.form.resultPositive}</option>
              <option value="negative">{t.form.resultNegative}</option>
              <option value="invalid">{t.form.resultInvalid}</option>
            </select>
          </div>

          <div>
            <label htmlFor="yearOfBirth" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
              {t.form.yearOfBirthRequired}
            </label>
            <input
              id="yearOfBirth"
              type="text"
              inputMode="numeric"
              required
              value={yearOfBirth}
              onChange={(e) => setYearOfBirth(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              placeholder={t.form.yearOfBirthPlaceholder}
            />
          </div>
        </div>

        {/* Pathogen selection (only if result is positive) - right after Result */}
        {result === 'positive' && (
          <div>
            <label htmlFor="pathogen" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
              {t.form.pathogenRequired} ({t.form.resultPositive})
            </label>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 mb-2">
              {t.form.pathogenHelp}
            </p>
            {!testTypeId ? (
              <p className="mt-1 text-sm text-gray-500">
                {t.form.pathogenSelectFirst}
              </p>
            ) : availablePathogens.length === 0 ? (
              <p className="mt-1 text-sm text-gray-500">
                {t.form.pathogenNoneAvailable}
              </p>
            ) : (
              <select
                id="pathogen"
                required={result === 'positive'}
                value={pathogenId}
                onChange={(e) => setPathogenId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              >
                <option value="">-- {t.form.pathogen} --</option>
                {availablePathogens.map((pathogen) => (
                  <option key={pathogen.id} value={pathogen.id}>
                    {pathogen.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* City Selection */}
        <div>
          <label htmlFor="city" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
            {t.form.cityRequired}
          </label>
          {loadingInitialCity ? (
            <div className="mt-1 text-sm text-gray-500">Načítání města...</div>
          ) : (
            <>
              <div className="relative mt-1">
                <input
                  ref={cityInputRef}
                  id="city"
                  type="text"
                  required
                  value={citySearchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCitySearchQuery(value);
                    // If user clears the input or changes it, clear selection
                    if (!value) {
                      setSelectedCity(null);
                    } else if (selectedCity && value !== selectedCity.name) {
                      // If user is typing something different, clear the selection
                      setSelectedCity(null);
                    }
                  }}
                  onFocus={() => {
                    // Show suggestions if there are any, or if user is typing
                    if (citySearchQuery.trim() && !selectedCity) {
                      setShowCitySuggestions(true);
                    } else if (citySuggestions.length > 0) {
                      setShowCitySuggestions(true);
                    }
                  }}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  placeholder={t.form.cityPlaceholder}
                />
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg"
                  >
                    {citySuggestions.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => {
                          setSelectedCity(city);
                          setCitySearchQuery(city.name);
                          setShowCitySuggestions(false);
                          setCitySuggestions([]);
                          // Save to localStorage when user selects a city
                          if (typeof window !== 'undefined' && !isEditMode) {
                            try {
                              localStorage.setItem('lastCityId', city.id.toString());
                            } catch (error) {
                              // Handle localStorage errors gracefully
                              console.warn('Failed to save last city to localStorage:', error);
                            }
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      >
                        <div className="font-medium">{city.name}</div>
                        {city.district && (
                          <div className="text-xs text-gray-500">
                            {city.district.name}
                            {city.district.region && `, ${city.district.region.name}`}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Display selected city's region and district */}
              {selectedCity && selectedCity.district && (
                <div className="mt-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Kraj:</span> {selectedCity.district.region?.name || 'Neznámý'}
                  </div>
                  <div>
                    <span className="font-medium">Okres:</span> {selectedCity.district.name}
                  </div>
                </div>
              )}
            </>
          )}
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label htmlFor="testDate" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
              {t.form.testDateRequired}
            </label>
            <input
              id="testDate"
              type="date"
              required
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            />
          </div>
        </div>

        {/* Symptoms Section */}
        <div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-4">
            {t.form.symptoms}:
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
            {t.form.symptomsHelp}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="temperature" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                {t.form.temperature}
              </label>
              <input
                id="temperature"
                type="text"
                inputMode="decimal"
                value={temperature}
                onChange={(e) => {
                  let value = e.target.value;
                  
                  // Allow both comma and dot as decimal separator
                  // Normalize to dot for validation, but allow comma in display
                  let normalizedValue = value.replace(',', '.');
                  
                  // Handle multiple decimal separators - keep only the first one
                  const parts = normalizedValue.split('.');
                  if (parts.length > 2) {
                    normalizedValue = parts[0] + '.' + parts.slice(1).join('');
                    // Also update display value to match
                    const displayParts = value.split(/[,.]/);
                    if (value.includes(',')) {
                      value = displayParts[0] + ',' + displayParts.slice(1).join('');
                    } else {
                      value = displayParts[0] + '.' + displayParts.slice(1).join('');
                    }
                  }
                  
                  // Allow empty string (field is optional)
                  if (value === '') {
                    setTemperature('');
                    return;
                  }
                  
                  // Validate: must be a valid number format (digits with optional one decimal separator)
                  // Allow both comma and dot in the format check
                  const isValidFormat = /^\d+[,.]?\d*$/.test(value);
                  
                  if (isValidFormat) {
                    const numValue = parseFloat(normalizedValue);
                    // Only set if in valid range (35-42) or if user is still typing (partial input)
                    // Allow partial values like "3" or "36," or "36." while typing, but validate final value
                    if (!isNaN(numValue) && numValue >= 35 && numValue <= 42) {
                      setTemperature(value); // Keep original format (comma or dot)
                    } else if (value.length < 2 || value.endsWith(',') || value.endsWith('.')) {
                      // Allow partial input while typing (e.g., "3", "36,", "36.", "4")
                      setTemperature(value);
                    }
                    // If out of range and complete, don't update (keep previous valid value)
                  }
                  // If invalid format, don't update (keep previous valid value)
                }}
                placeholder={t.form.temperaturePlaceholder}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              <p className="mt-1 text-xs text-gray-500">{t.form.temperatureRange}</p>
            </div>
          </div>

          {/* Symptom checkboxes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {initialCommonSymptoms.map((symptom) => (
              <label
                key={symptom.id}
                className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2 sm:p-0 rounded-md hover:bg-gray-50 active:bg-gray-100 min-h-[44px] sm:min-h-0"
              >
                <input
                  type="checkbox"
                  checked={selectedSymptoms.includes(symptom.name)}
                  onChange={() => toggleSymptom(symptom.name)}
                  className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm sm:text-sm text-gray-700 flex-1">{symptom.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="otherInformations" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
            {t.form.notes} ({t.form.additionalInfo.replace(':', '').toLowerCase()})
          </label>
          <textarea
            id="otherInformations"
            rows={4}
            value={otherInformations}
            onChange={(e) => setOtherInformations(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder={t.form.notesPlaceholder}
          />
        </div>

        {/* Optional Boolean Fields */}
        <div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
            {t.form.additionalInfo}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2 sm:p-0 rounded-md hover:bg-gray-50 active:bg-gray-100 min-h-[44px] sm:min-h-0">
              <input
                type="checkbox"
                checked={sari}
                onChange={(e) => setSari(e.target.checked)}
                className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">{t.form.sari}</span>
            </label>
            <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2 sm:p-0 rounded-md hover:bg-gray-50 active:bg-gray-100 min-h-[44px] sm:min-h-0">
              <input
                type="checkbox"
                checked={atb}
                onChange={(e) => setAtb(e.target.checked)}
                className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">{t.form.atb}</span>
            </label>
            <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2 sm:p-0 rounded-md hover:bg-gray-50 active:bg-gray-100 min-h-[44px] sm:min-h-0">
              <input
                type="checkbox"
                checked={antivirals}
                onChange={(e) => setAntivirals(e.target.checked)}
                className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">{t.form.antivirals}</span>
            </label>
            <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2 sm:p-0 rounded-md hover:bg-gray-50 active:bg-gray-100 min-h-[44px] sm:min-h-0">
              <input
                type="checkbox"
                checked={obesity}
                onChange={(e) => setObesity(e.target.checked)}
                className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">{t.form.obesity}</span>
            </label>
            <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2 sm:p-0 rounded-md hover:bg-gray-50 active:bg-gray-100 min-h-[44px] sm:min-h-0">
              <input
                type="checkbox"
                checked={respiratorySupport}
                onChange={(e) => setRespiratorySupport(e.target.checked)}
                className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">{t.form.respiratorySupport}</span>
            </label>
            <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2 sm:p-0 rounded-md hover:bg-gray-50 active:bg-gray-100 min-h-[44px] sm:min-h-0">
              <input
                type="checkbox"
                checked={ecmo}
                onChange={(e) => setEcmo(e.target.checked)}
                className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">{t.form.ecmo}</span>
            </label>
            <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2 sm:p-0 rounded-md hover:bg-gray-50 active:bg-gray-100 min-h-[44px] sm:min-h-0">
              <input
                type="checkbox"
                checked={pregnancy}
                onChange={(e) => {
                  setPregnancy(e.target.checked);
                  // Clear trimester when pregnancy is unchecked
                  if (!e.target.checked) {
                    setTrimester(null);
                  }
                }}
                className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">{t.form.pregnancy}</span>
            </label>
          </div>

          {/* Trimester Selector (shown when pregnancy is checked) */}
          {pregnancy && (
            <div className="mt-4">
              <label htmlFor="trimester" className="block text-sm sm:text-base font-medium text-gray-900 mb-1.5">
                {t.form.trimester}
              </label>
              <select
                id="trimester"
                value={trimester || ''}
                onChange={(e) => setTrimester(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              >
                <option value="">{t.form.selectOption}</option>
                <option value="1">{t.form.trimesterFirst}</option>
                <option value="2">{t.form.trimesterSecond}</option>
                <option value="3">{t.form.trimesterThird}</option>
              </select>
            </div>
          )}
        </div>

        {/* Vaccinations */}
        <VaccinationSelector
          vaccinations={initialVaccinations}
          value={vaccinations}
          onChange={setVaccinations}
        />

        {/* Submit Button */}
        <div className="flex justify-stretch sm:justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-sm font-medium min-h-[44px] sm:min-h-0"
          >
            {loading ? (isEditMode ? t.form.saving : t.form.submitting) : (isEditMode ? t.form.saveChanges : t.form.submit)}
          </button>
          </div>
        </form>
      </div>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        linkToken={linkToken}
        contextUrl={typeof window !== 'undefined' ? window.location.href : null}
      />
    </>
  );
}

