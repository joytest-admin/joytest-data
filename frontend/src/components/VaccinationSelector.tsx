'use client';

import { useState, useEffect } from 'react';
import { Vaccination, TestResultVaccinationRequest } from '@/src/types/api.types';
import { useTranslation } from '@/src/contexts/TranslationContext';

interface VaccinationSelectorProps {
  vaccinations: Vaccination[]; // Available vaccinations to choose from
  value: TestResultVaccinationRequest[]; // Selected vaccinations
  onChange: (vaccinations: TestResultVaccinationRequest[]) => void;
}

/**
 * Vaccination selector component
 * Shows all vaccinations as checkboxes with additional fields (vaccine name, batch number, vaccination date)
 */
export default function VaccinationSelector({
  vaccinations,
  value,
  onChange,
}: VaccinationSelectorProps) {
  const { t } = useTranslation();
  const [selectedVaccinations, setSelectedVaccinations] = useState<Map<string, TestResultVaccinationRequest>>(
    new Map()
  );

  // Initialize from value prop - create a map keyed by vaccinationId
  useEffect(() => {
    const map = new Map<string, TestResultVaccinationRequest>();
    if (value && value.length > 0) {
      value.forEach((v) => {
        if (v.vaccinationId) {
          map.set(v.vaccinationId, v);
        }
      });
    }
    setSelectedVaccinations(map);
  }, [value]);

  // Handle checkbox toggle
  const handleCheckboxChange = (vaccinationId: string, checked: boolean) => {
    const updated = new Map(selectedVaccinations);
    if (checked) {
      // Add vaccination with empty additional fields
      updated.set(vaccinationId, {
        vaccinationId,
        vaccineName: undefined,
        batchNumber: undefined,
        vaccinationDate: undefined,
      });
    } else {
      // Remove vaccination
      updated.delete(vaccinationId);
    }
    setSelectedVaccinations(updated);
    onChange(Array.from(updated.values()));
  };

  // Handle additional field changes
  const handleFieldChange = (
    vaccinationId: string,
    field: keyof TestResultVaccinationRequest,
    newValue: string,
  ) => {
    const updated = new Map(selectedVaccinations);
    const existing = updated.get(vaccinationId);
    if (existing) {
      updated.set(vaccinationId, {
        ...existing,
        [field]: newValue || undefined, // Convert empty string to undefined
      });
      setSelectedVaccinations(updated);
      onChange(Array.from(updated.values()));
    }
  };

  // Format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Parse date from input (YYYY-MM-DD) to ISO string
  const parseDateFromInput = (inputValue: string): string | undefined => {
    if (!inputValue) return undefined;
    try {
      const date = new Date(inputValue);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString();
    } catch {
      return undefined;
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm sm:text-base font-medium text-gray-900">
        {t.form.vaccinations}
      </label>

      {vaccinations.length === 0 ? (
        <p className="text-sm text-gray-600 italic">{t.form.vaccinationOptional}</p>
      ) : (
        <div className="space-y-4">
          {vaccinations.map((vaccination) => {
            const isChecked = selectedVaccinations.has(vaccination.id);
            const selectedData = selectedVaccinations.get(vaccination.id);

            return (
              <div
                key={vaccination.id}
                className="border border-gray-300 rounded-lg p-4 bg-white space-y-3"
              >
                {/* Checkbox and Vaccination Name */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange(vaccination.id, e.target.checked)}
                    className="w-5 h-5 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-900">{vaccination.name}</span>
                </label>

                {/* Additional Fields (shown when checked) */}
                {isChecked && (
                  <div className="ml-7 sm:ml-8 space-y-3 pt-2 border-t border-gray-200">
                    {/* Vaccine Name */}
                    <div>
                      <label
                        htmlFor={`vaccine-name-${vaccination.id}`}
                        className="block text-sm font-medium text-gray-900 mb-1"
                      >
                        {t.form.vaccineName}
                      </label>
                      <input
                        type="text"
                        id={`vaccine-name-${vaccination.id}`}
                        value={selectedData?.vaccineName || ''}
                        onChange={(e) =>
                          handleFieldChange(vaccination.id, 'vaccineName', e.target.value)
                        }
                        placeholder={t.form.vaccineNamePlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                      />
                    </div>

                    {/* Batch Number */}
                    <div>
                      <label
                        htmlFor={`batch-number-${vaccination.id}`}
                        className="block text-sm font-medium text-gray-900 mb-1"
                      >
                        {t.form.batchNumber}
                      </label>
                      <input
                        type="text"
                        id={`batch-number-${vaccination.id}`}
                        value={selectedData?.batchNumber || ''}
                        onChange={(e) =>
                          handleFieldChange(vaccination.id, 'batchNumber', e.target.value)
                        }
                        placeholder={t.form.batchNumberPlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                      />
                    </div>

                    {/* Vaccination Date */}
                    <div>
                      <label
                        htmlFor={`vaccination-date-${vaccination.id}`}
                        className="block text-sm font-medium text-gray-900 mb-1"
                      >
                        {t.form.vaccinationDate}
                      </label>
                      <input
                        type="date"
                        id={`vaccination-date-${vaccination.id}`}
                        value={formatDateForInput(selectedData?.vaccinationDate)}
                        onChange={(e) => {
                          const isoDate = parseDateFromInput(e.target.value);
                          handleFieldChange(vaccination.id, 'vaccinationDate', isoDate || '');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base text-gray-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
