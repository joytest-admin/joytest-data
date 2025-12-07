'use client';

/**
 * Common symptom form component
 * Form for creating/editing common symptoms
 */

import { useState, useEffect } from 'react';
import { CommonSymptom } from '@/src/types/api.types';

interface CommonSymptomFormProps {
  symptom: CommonSymptom | null;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  loading: boolean;
}

export default function CommonSymptomForm({
  symptom,
  onSubmit,
  onCancel,
  loading,
}: CommonSymptomFormProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (symptom) {
      setName(symptom.name);
    } else {
      setName('');
    }
  }, [symptom]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {symptom ? 'Upravit běžný příznak' : 'Přidat běžný příznak'}
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
            placeholder="Např. Horečka"
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
            {loading ? 'Ukládání...' : symptom ? 'Uložit změny' : 'Vytvořit'}
          </button>
        </div>
      </form>
    </div>
  );
}

