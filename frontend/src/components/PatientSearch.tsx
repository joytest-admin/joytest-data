'use client';

import { useState, useEffect, useRef } from 'react';
import { apiGet } from '@/src/lib/api-client';
import { ApiResponse, Patient } from '@/src/types/api.types';

interface PatientSearchProps {
  value: string | null; // Selected patient ID
  onChange: (patientId: string | null, patient: Patient | null) => void;
  linkToken?: string | null;
}

/**
 * Patient search component for export functionality
 * Allows searching and selecting existing patients only (no create functionality)
 */
export default function PatientSearch({ value, onChange, linkToken }: PatientSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load selected patient if value is set
  useEffect(() => {
    if (value && !selectedPatient) {
      const found = searchResults.find((p) => p.id === value);
      if (found) {
        setSelectedPatient(found);
        setSearchTerm(found.identifier);
      } else if (value) {
        // If not in search results, try to fetch it directly
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
            setSelectedPatient(null);
            setSearchTerm('');
            onChange(null, null);
          }
        };
        loadPatient();
      }
    } else if (!value && selectedPatient) {
      setSelectedPatient(null);
      setSearchTerm('');
    }
  }, [value, selectedPatient, searchResults, linkToken, onChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search patients with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const queryParams = linkToken ? `&token=${linkToken}` : '';
        const response = await apiGet<ApiResponse<Patient[]>>(
          `/patients/my/search?q=${encodeURIComponent(searchTerm.trim())}&limit=10${queryParams}`,
        );
        if (response.success && response.data) {
          setSearchResults(response.data);
          setShowDropdown(true);
        } else {
          setError(response.error?.message || 'Vyhledávání selhalo');
        }
      } catch (err: any) {
        setError(err.message || 'Vyhledávání selhalo');
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
  }, [searchTerm, linkToken]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchTerm(patient.identifier);
    setShowDropdown(false);
    onChange(patient.id, patient);
  };

  const handleClearSelection = () => {
    setSelectedPatient(null);
    setSearchTerm('');
    setSearchResults([]);
    onChange(null, null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label htmlFor="patient-search" className="block text-sm font-medium text-gray-700 mb-1.5">
        Vyhledat pacienta*
      </label>
      <div className="relative">
        <input
          id="patient-search"
          type="text"
          value={selectedPatient ? selectedPatient.identifier : searchTerm}
          onChange={(e) => {
            if (selectedPatient) {
              handleClearSelection();
            }
            setSearchTerm(e.target.value);
          }}
          onFocus={() => {
            if (searchResults.length > 0 || searchTerm.trim().length >= 2) {
              setShowDropdown(true);
            }
          }}
          placeholder="Zadejte identifikátor pacienta pro vyhledání..."
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 sm:px-4 py-3 sm:py-2.5 text-base sm:text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        />
        {selectedPatient && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Zrušit výběr"
          >
            ✕
          </button>
        )}
        {isSearching && (
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

      {showDropdown && !isSearching && searchTerm.trim().length >= 2 && searchResults.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-4 text-sm text-gray-500">
          Žádný pacient nenalezen. Zadejte alespoň 2 znaky pro vyhledání.
        </div>
      )}
    </div>
  );
}

