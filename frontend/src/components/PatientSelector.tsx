'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost } from '@/src/lib/api-client';
import { ApiResponse, Patient, CreatePatientRequest } from '@/src/types/api.types';
import { useTranslation } from '@/src/contexts/TranslationContext';

interface PatientSelectorProps {
  value: string | null; // Selected patient ID
  onChange: (patientId: string | null, patient: Patient | null) => void;
  linkToken?: string | null;
}

/**
 * Patient selector component
 * Allows searching and selecting existing patients or creating new ones automatically
 */
export default function PatientSelector({ value, onChange, linkToken }: PatientSelectorProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load selected patient if value is set
  useEffect(() => {
    if (value && !selectedPatient) {
      // Try to find patient in search results first
      const found = searchResults.find((p) => p.id === value);
      if (found) {
        setSelectedPatient(found);
        setSearchTerm(found.identifier);
      } else {
        // If not in search results, fetch patient by ID
        const loadPatient = async () => {
          try {
            const queryParams = linkToken ? `?token=${linkToken}` : '';
            const response = await apiGet<ApiResponse<Patient>>(
              `/patients/my/${value}${queryParams}`,
            );
            if (response.success && response.data) {
              setSelectedPatient(response.data);
              setSearchTerm(response.data.identifier);
            }
          } catch (err) {
            console.error('Failed to load patient by ID:', err);
            // Don't show error - patient might have been deleted
          }
        };
        loadPatient();
      }
    } else if (!value && selectedPatient) {
      // Clear selection if value is cleared
      setSelectedPatient(null);
      setSearchTerm('');
    }
  }, [value, selectedPatient, searchResults, linkToken]);

  // Close dropdown and tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => {
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
      };
    }
  }, [successMessage]);

  // Search patients with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if a patient is already selected
    if (selectedPatient) {
      return;
    }

    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setError(null);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const response = await apiGet<ApiResponse<Patient[]>>(
          `/patients/my/search?q=${encodeURIComponent(searchTerm.trim())}&limit=10${linkToken ? `&token=${linkToken}` : ''}`,
        );
        if (response.success && response.data) {
          setSearchResults(response.data);
          setShowDropdown(true);
        } else {
          setError(response.error?.message || t.form.patientSearchFailed);
        }
      } catch (err: any) {
        setError(err.message || t.form.patientSearchFailed);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, linkToken, t, selectedPatient]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchTerm(patient.identifier);
    setShowDropdown(false);
    setError(null);
    onChange(patient.id, patient);
  };

  const handleClearSelection = () => {
    setSelectedPatient(null);
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
    setSuccessMessage(null);
    onChange(null, null);
  };

  /**
   * Auto-create patient with just identifier (no note, no yearOfBirth)
   */
  const handleAutoCreatePatient = async (identifier: string) => {
    if (!identifier.trim() || identifier.trim().length < 2) {
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const createData: CreatePatientRequest = {
        identifier: identifier.trim(),
        // No note, no yearOfBirth - create with just identifier
      };

      const response = await apiPost<ApiResponse<Patient>>(
        `/patients/my${linkToken ? `?token=${linkToken}` : ''}`,
        createData,
      );

      if (response.success && response.data) {
        const newPatient = response.data;
        setSelectedPatient(newPatient);
        setSearchTerm(newPatient.identifier);
        setSearchResults([newPatient]); // Add to search results so it shows as selected
        setShowDropdown(false);
        setSuccessMessage(t.form.patientCreated || `Patient "${newPatient.identifier}" created`);
        onChange(newPatient.id, newPatient);
      } else {
        // Check if it's a duplicate error
        const errorMsg = response.error?.message || t.form.patientCreateFailed;
        if (errorMsg.toLowerCase().includes('duplicate') || errorMsg.toLowerCase().includes('already exists')) {
          // Try to search again - maybe the patient was just created
          const searchResponse = await apiGet<ApiResponse<Patient[]>>(
            `/patients/my/search?q=${encodeURIComponent(identifier.trim())}&limit=1${linkToken ? `&token=${linkToken}` : ''}`,
          );
          if (searchResponse.success && searchResponse.data && searchResponse.data.length > 0) {
            const existingPatient = searchResponse.data[0];
            setSelectedPatient(existingPatient);
            setSearchTerm(existingPatient.identifier);
            setSearchResults([existingPatient]); // Add to search results
            setShowDropdown(false);
            onChange(existingPatient.id, existingPatient);
            return;
          }
        }
        setError(errorMsg);
      }
    } catch (err: any) {
      // Check if it's a duplicate error
      const errorMsg = err.message || t.form.patientCreateFailed;
      if (errorMsg.toLowerCase().includes('duplicate') || errorMsg.toLowerCase().includes('already exists')) {
        // Try to search again
        try {
          const searchResponse = await apiGet<ApiResponse<Patient[]>>(
            `/patients/my/search?q=${encodeURIComponent(identifier.trim())}&limit=1${linkToken ? `&token=${linkToken}` : ''}`,
          );
          if (searchResponse.success && searchResponse.data && searchResponse.data.length > 0) {
            const existingPatient = searchResponse.data[0];
            setSelectedPatient(existingPatient);
            setSearchTerm(existingPatient.identifier);
            setSearchResults([existingPatient]); // Add to search results
            setShowDropdown(false);
            onChange(existingPatient.id, existingPatient);
            return;
          }
        } catch (searchErr) {
          // Ignore search error, show original error
        }
      }
      setError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Handle Enter key press - auto-create if no results
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If dropdown is open with results, don't create
      if (showDropdown && searchResults.length > 0) {
        return;
      }

      // If no results and valid search term, create patient
      if (!isSearching && !isCreating && searchTerm.trim().length >= 2 && searchResults.length === 0) {
        handleAutoCreatePatient(searchTerm);
      }
    }
  };

  /**
   * Handle blur - optionally auto-create (disabled for now to avoid accidental creation)
   */
  const handleBlur = () => {
    // Don't auto-create on blur - too aggressive
    // User can use Enter key or click the create button
  };

  // Check if we can show create option (only if no patient is selected)
  const canCreate = !selectedPatient && !isSearching && !isCreating && searchTerm.trim().length >= 2 && searchResults.length === 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2 mb-1.5">
        <label htmlFor="patient" className="block text-sm sm:text-base font-medium text-gray-700">
          {t.form.patientIdentifierOptional}
        </label>
        <div className="group relative">
          <button
            type="button"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-700 text-xs font-semibold transition-colors"
            aria-label={t.form.patientIdentifierAriaLabel}
          >
            ?
          </button>
          {showTooltip && (
            <div className="absolute left-0 bottom-full mb-2 z-50 w-64 sm:w-72">
              <div className="bg-gray-900 text-white text-xs sm:text-sm rounded-lg px-3 py-2 shadow-lg">
                <p className="leading-relaxed">
                  {t.form.patientIdentifierTooltip}
                </p>
                <div className="absolute left-4 bottom-0 transform translate-y-full">
                  <div className="border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          id="patient"
          type="text"
          value={selectedPatient ? selectedPatient.identifier : searchTerm}
          onChange={(e) => {
            if (selectedPatient) {
              handleClearSelection();
            }
            setSearchTerm(e.target.value);
            setError(null);
            setSuccessMessage(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            // Only show dropdown if patient is not selected and we have results or can create
            if (!selectedPatient) {
              if (searchResults.length > 0 || canCreate) {
                setShowDropdown(true);
              }
            }
          }}
          placeholder={t.form.patientIdentifierPlaceholder}
          disabled={isCreating}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {selectedPatient && !isCreating && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title={t.form.patientClearSelection}
          >
            ✕
          </button>
        )}
        {(isSearching || isCreating) && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {successMessage && (
        <p className="mt-1 text-sm text-green-600">{successMessage}</p>
      )}

      {/* Search Results Dropdown */}
      {showDropdown && searchResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {searchResults.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => handleSelectPatient(patient)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              <div className="font-medium text-gray-900">
                {patient.identifier}
                {patient.yearOfBirth && (
                  <span className="text-sm font-normal text-gray-600 ml-2">({patient.yearOfBirth})</span>
                )}
              </div>
              {patient.note && (
                <div className="text-sm text-gray-500 truncate">{patient.note}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Create New Patient Option */}
      {showDropdown && canCreate && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-3">
            <div className="text-sm text-gray-600 mb-2">
              {t.form.patientCreateNew || 'Create new patient'}: "{searchTerm}"
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAutoCreatePatient(searchTerm)}
                disabled={isCreating}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? (t.form.patientCreating || 'Creating...') : (t.form.patientCreate || 'Create')}
              </button>
              <span className="text-xs text-gray-500">
                {t.form.patientPressEnter || 'or press Enter'}
              </span>
            </div>
          </div>
        </div>
      )}

      {isSearching && showDropdown && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-sm text-gray-500">
          {t.form.patientSearching}
        </div>
      )}
    </div>
  );
}
