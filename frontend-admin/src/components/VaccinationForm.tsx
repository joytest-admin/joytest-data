'use client';

/**
 * Vaccination form component
 * Form for creating/editing vaccinations
 */

import { useState, useEffect } from 'react';
import { Vaccination } from '@/src/types/api.types';

interface VaccinationFormProps {
  vaccination: Vaccination | null;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  loading: boolean;
}

export default function VaccinationForm({
  vaccination,
  onSubmit,
  onCancel,
  loading,
}: VaccinationFormProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (vaccination) {
      setName(vaccination.name);
    } else {
      setName('');
    }
  }, [vaccination]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {vaccination ? 'Upravit typ vakcíny' : 'Přidat typ vakcíny'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Název
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Např. Pfizer-BioNTech"
          />
        </div>
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
            disabled={loading || !name.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Ukládání...' : vaccination ? 'Uložit změny' : 'Vytvořit'}
          </button>
        </div>
      </form>
    </div>
  );
}

