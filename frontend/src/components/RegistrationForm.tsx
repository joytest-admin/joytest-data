/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect, useRef } from 'react';
import { apiPost } from '@/src/lib/api-client';
import { getCities, getCityById } from '@/src/lib/api-client';
import { ApiResponse, PreregisterRequest, PreregisterResponse, CityResponse } from '@/src/types/api.types';

interface RegistrationFormProps {
  onSuccess?: () => void;
}

/**
 * Registration form for doctors to preregister
 * Allows choosing between password-based or link-based authentication
 * Includes geography selection (city)
 */
export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [icpNumber, setIcpNumber] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityResponse | null>(null);
  const [citySuggestions, setCitySuggestions] = useState<CityResponse[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [email, setEmail] = useState('');
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const cityInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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
    if (!value || (selectedCity && value !== selectedCity.name)) {
      // User is editing the input after selecting a city - clear the selection
      setSelectedCity(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!icpNumber.trim()) {
      setError('IČP je povinné');
      return;
    }

    if (!selectedCity) {
      setError('Město je povinné');
      return;
    }


    if (requirePassword && !email.trim()) {
      setError('E-mail je povinný pokud chcete používat heslo');
      return;
    }

    if (requirePassword) {
      if (!password || password.length < 8) {
        setError('Heslo musí mít alespoň 8 znaků');
        return;
      }
      if (password !== confirmPassword) {
        setError('Hesla se neshodují');
        return;
      }
    }

    const payload: PreregisterRequest = {
      icpNumber: icpNumber.trim(),
      cityId: selectedCity.id,
      requirePassword,
      email: email.trim() || undefined,
      password: requirePassword ? password : undefined,
    };

    setLoading(true);
    try {
      const response = await apiPost<ApiResponse<PreregisterResponse>>('/auth/preregister', payload);
      if (response.success) {
        setSuccessMessage('Registrace byla odeslána. Po schválení administrátorem vás budeme kontaktovat.');
        setIcpNumber('');
        setCitySearchQuery('');
        setSelectedCity(null);
        setEmail('');
        setRequirePassword(false);
        setPassword('');
        setConfirmPassword('');
        onSuccess?.();
      } else {
        setError(response.error?.message || 'Registraci se nepodařilo odeslat');
      }
    } catch (err: any) {
      setError(err.message || 'Registraci se nepodařilo odeslat');
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
        <label htmlFor="icpNumber" className="block text-sm font-medium text-gray-700">
        Vaše IČL*
        </label>
        <input
          id="icpNumber"
          type="text"
          value={icpNumber}
          onChange={(e) => setIcpNumber(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="12345678"
          required
        />
      </div>

      {/* City Selection */}
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
          Město ordinace* (lze později změnit pokud máte více ordinací)
        </label>
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
            placeholder="Zadejte název města..."
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
      </div>


      <div className="space-y-2">
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
          Chci používat klasické přihlášení jménem a heslem
        </label>
        <p className="text-xs text-gray-500">
        Pokud nezaškrtnete, obdržíte od nás unikátní odkaz, přes který se budete jednoduše přihlašovat bez nutnosti vyplňování jména a hesla
        </p>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          E-mail {requirePassword && <span className="text-red-500">*</span>}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="lekar@example.cz"
          required={requirePassword}
        />
      </div>

      {requirePassword && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Heslo*
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Potvrzení hesla*
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
              required
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Odesílám...' : 'Odeslat registraci'}
      </button>
    </form>
  );
}
