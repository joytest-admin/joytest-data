/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect, useRef } from 'react';
import { apiPut } from '@/src/lib/api-client';
import { getCities, getCityById } from '@/src/lib/api-client';
import {
  ApiResponse,
  DoctorProfileResponse,
  UpdateDoctorProfileRequest,
  CityResponse,
} from '@/src/types/api.types';
import { useTranslation } from '@/src/contexts/TranslationContext';

interface SettingsFormProps {
  profile: DoctorProfileResponse;
  settingsUrl: string;
  linkToken?: string | null;
}

export default function SettingsForm({ profile, settingsUrl, linkToken }: SettingsFormProps) {
  const { t } = useTranslation();
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [email, setEmail] = useState(profile.email || '');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityResponse | null>(null);
  const [citySuggestions, setCitySuggestions] = useState<CityResponse[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [loadingInitialCity, setLoadingInitialCity] = useState(false);
  const [requirePassword, setRequirePassword] = useState(profile.requirePassword);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const cityInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load initial city from profile
  useEffect(() => {
    const loadInitialCity = async () => {
      if (profile.cityId) {
        setLoadingInitialCity(true);
        try {
          const city = await getCityById(profile.cityId);
          if (city) {
            setSelectedCity(city);
            setCitySearchQuery(city.name);
          }
        } catch (err) {
          console.error('Failed to load initial city:', err);
        } finally {
          setLoadingInitialCity(false);
        }
      }
    };
    loadInitialCity();
  }, [profile.cityId]);

  // Debounced city search
  useEffect(() => {
    if (!citySearchQuery.trim() || selectedCity) {
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

  const handleCitySelect = (city: CityResponse) => {
    setSelectedCity(city);
    setCitySearchQuery(city.name);
    setShowCitySuggestions(false);
    setCitySuggestions([]);
  };

  const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCitySearchQuery(value);
    if (!value) {
      setSelectedCity(null);
    }
  };

  const [currentLinkToken, setCurrentLinkToken] = useState<string | null>(
    profile.uniqueLinkToken || linkToken || null,
  );
  const uniqueLink =
    currentLinkToken && typeof window !== 'undefined'
      ? `${window.location.origin}/?token=${currentLinkToken}`
      : currentLinkToken
      ? `${settingsUrl.split('/settings')[0]}/?token=${currentLinkToken}`
      : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate city part if city is selected
    if (!selectedCity) {
      setError(t.pages.settings.cityRequiredError);
      return;
    }

    if (requirePassword) {
      if (!email.trim()) {
        setError(t.pages.settings.emailRequiredError);
        return;
      }
      if (password || confirmPassword) {
        if (password.length < 8) {
          setError(t.pages.settings.passwordMinLengthError);
          return;
        }
        if (password !== confirmPassword) {
          setError(t.pages.settings.passwordMismatchError);
          return;
        }
      }
    }

    const payload: UpdateDoctorProfileRequest = {
      email: email.trim() || undefined,
      cityId: selectedCity?.id,
      requirePassword,
      ...(password ? { password } : {}),
    };

    setLoading(true);
    try {
      const response = await apiPut<ApiResponse<DoctorProfileResponse>>(
        `/auth/profile${linkToken ? `?token=${linkToken}` : ''}`,
        payload,
      );
      if (response.success && response.data) {
        const updated = response.data;
        setCurrentProfile(updated);
        setRequirePassword(updated.requirePassword);
        setEmail(updated.email || '');
        
        // Update city if cityId changed
        if (updated.cityId) {
          try {
            const city = await getCityById(updated.cityId);
            if (city) {
              setSelectedCity(city);
              setCitySearchQuery(city.name);
            }
          } catch (err) {
            console.error('Failed to load updated city:', err);
          }
        } else {
          // If cityId was removed, clear the selection
          setSelectedCity(null);
          setCitySearchQuery('');
        }
        
        setCurrentLinkToken(updated.uniqueLinkToken || null);
        setSuccessMessage(t.pages.settings.saved);
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(response.error?.message || t.pages.settings.saveError);
      }
    } catch (err: any) {
      setError(err.message || t.pages.settings.saveError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          {t.pages.settings.email} {requirePassword && <span className="text-red-500">*</span>}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t.pages.settings.emailPlaceholder}
          required={requirePassword}
        />
        <p className="mt-1 text-xs text-gray-500">
          {t.pages.settings.emailHelp}
        </p>
      </div>

      {/* City Selection */}
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
          {t.pages.settings.city}*
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
                value={citySearchQuery}
                onChange={handleCityInputChange}
                onFocus={() => {
                  if (citySuggestions.length > 0) {
                    setShowCitySuggestions(true);
                  }
                }}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t.pages.settings.cityPlaceholder}
                required
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
                      onClick={() => handleCitySelect(city)}
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


      <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={requirePassword}
            onChange={(e) => {
              setRequirePassword(e.target.checked);
              if (!e.target.checked) {
                setPassword('');
                setConfirmPassword('');
              }
            }}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          {t.pages.settings.passwordLogin}
        </label>
        <p className="text-xs text-gray-500">
          {t.pages.settings.passwordLoginHelp}
        </p>
      </div>

      {requirePassword && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {t.pages.settings.newPassword}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.pages.settings.passwordPlaceholder}
            />
            <p className="mt-1 text-xs text-gray-500">{t.pages.settings.passwordHelp}</p>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              {t.pages.settings.confirmPassword}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.pages.settings.passwordPlaceholder}
            />
          </div>
        </div>
      )}

      {!requirePassword && uniqueLink && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="font-semibold">{t.pages.settings.uniqueLink}</p>
          <p className="mt-1 break-all font-mono text-xs">{uniqueLink}</p>
          <p className="mt-2 text-xs">
            {t.pages.settings.uniqueLinkHelp}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? t.pages.settings.saving : t.pages.settings.save}
      </button>
    </form>
  );
}

