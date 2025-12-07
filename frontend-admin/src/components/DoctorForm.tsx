'use client';

/**
 * Doctor form component
 * Form for creating and editing doctors (users)
 */

import { useState, useEffect, useRef } from 'react';
import { User, CityResponse } from '@/src/types/api.types';
import { getCities, getCityById } from '@/src/lib/api-client';

interface DoctorFormProps {
  user: User | null;
  onSubmit: (data: {
    email?: string;
    icpNumber: string;
    cityId: number;
    requirePassword: boolean;
    password?: string;
  }) => void;
  onCancel: () => void;
  loading: boolean;
}

export default function DoctorForm({
  user,
  onSubmit,
  onCancel,
  loading,
}: DoctorFormProps) {
  const [email, setEmail] = useState('');
  const [icpNumber, setIcpNumber] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityResponse | null>(null);
  const [citySuggestions, setCitySuggestions] = useState<CityResponse[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const cityInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load user data when editing
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        setEmail(user.email || '');
        setIcpNumber(user.icpNumber || '');
        setRequirePassword(user.requirePassword);
        setPassword('');
        setConfirmPassword('');

        // Load city if user has cityId
        if (user.cityId) {
          try {
            const city = await getCityById(user.cityId);
            if (city) {
              setSelectedCity(city);
              setCitySearchQuery(city.name);
            }
          } catch (err) {
            console.error('Failed to load user city data:', err);
          }
        } else {
          setSelectedCity(null);
          setCitySearchQuery('');
        }
      } else {
        // Reset form for new user
        setEmail('');
        setIcpNumber('');
        setCitySearchQuery('');
        setSelectedCity(null);
        setRequirePassword(false);
        setPassword('');
        setConfirmPassword('');
      }
    };

    loadUserData();
  }, [user]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (requirePassword && !email.trim()) {
      alert('Email je povinný, pokud je vyžadováno heslo');
      return;
    }

    if (!icpNumber.trim()) {
      alert('IČP je povinné');
      return;
    }

    if (!selectedCity) {
      alert('Město je povinné');
      return;
    }

    if (!selectedCity) {
      alert('Město je povinné');
      return;
    }

    if (requirePassword) {
      if (!password.trim()) {
        alert('Heslo je povinné, pokud je vyžadováno');
        return;
      }
      if (password.length < 8) {
        alert('Heslo musí mít alespoň 8 znaků');
        return;
      }
      if (password !== confirmPassword) {
        alert('Hesla se neshodují');
        return;
      }
    }

    onSubmit({
      email: email.trim() || undefined,
      icpNumber: icpNumber.trim(),
      cityId: selectedCity.id,
      requirePassword,
      password: requirePassword ? password : undefined,
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {user ? 'Upravit doktora' : 'Přidat doktora'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email{requirePassword && '*'}
          </label>
          <input
            id="email"
            type="email"
            required={requirePassword}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="doktor@example.com"
          />
          {!requirePassword && (
            <p className="mt-1 text-xs text-gray-500">
              Email je vyžadován pouze pokud je zapnuto vyžadování hesla
            </p>
          )}
        </div>

        <div>
          <label htmlFor="icpNumber" className="block text-sm font-medium text-gray-700">
            IČP*
          </label>
          <input
            id="icpNumber"
            type="text"
            required
            value={icpNumber}
            onChange={(e) => setIcpNumber(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="12345678"
          />
        </div>

        {/* City Selection */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            Město*
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
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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


        <div>
          <label className="flex items-center space-x-2">
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
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Vyžadovat heslo
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Pokud je zaškrtnuto, doktor se musí přihlásit pomocí emailu a hesla
          </p>
        </div>

        {requirePassword && (
          <>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {user ? 'Nové heslo' : 'Heslo*'}
                {user && <span className="text-xs text-gray-500"> (ponechte prázdné, pokud nechcete změnit)</span>}
              </label>
              <input
                id="password"
                type="password"
                required={!user}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="••••••••"
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-500">Minimálně 8 znaků</p>
            </div>

            {!user && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Potvrzení hesla*
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            )}
          </>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Zrušit
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Ukládání...' : user ? 'Uložit změny' : 'Vytvořit'}
          </button>
        </div>
      </form>
    </div>
  );
}
