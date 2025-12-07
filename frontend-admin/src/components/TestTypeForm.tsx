'use client';

/**
 * Test type form component
 * Form for creating/editing test types
 */

import { useState, useEffect } from 'react';
import { TestType, Pathogen } from '@/src/types/api.types';
import { get } from '@/src/lib/api-client';

interface TestTypeFormProps {
  testType: TestType | null;
  onSubmit: (name: string, pathogenIds: string[]) => void;
  onCancel: () => void;
  loading: boolean;
}

export default function TestTypeForm({
  testType,
  onSubmit,
  onCancel,
  loading,
}: TestTypeFormProps) {
  const [name, setName] = useState('');
  const [pathogens, setPathogens] = useState<Pathogen[]>([]);
  const [selectedPathogenIds, setSelectedPathogenIds] = useState<string[]>([]);
  const [loadingPathogens, setLoadingPathogens] = useState(true);

  useEffect(() => {
    // Load pathogens
    const loadPathogens = async () => {
      try {
        const response = await get<Pathogen[]>('/pathogens');
        if (response.success && response.data) {
          setPathogens(response.data);
        }
      } catch (err) {
        console.error('Failed to load pathogens:', err);
      } finally {
        setLoadingPathogens(false);
      }
    };
    loadPathogens();
  }, []);

  useEffect(() => {
    if (testType) {
      setName(testType.name);
      setSelectedPathogenIds(testType.pathogenIds || []);
    } else {
      setName('');
      setSelectedPathogenIds([]);
    }
  }, [testType]);

  const handlePathogenToggle = (pathogenId: string) => {
    setSelectedPathogenIds((prev) =>
      prev.includes(pathogenId)
        ? prev.filter((id) => id !== pathogenId)
        : [...prev, pathogenId],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), selectedPathogenIds);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        {testType ? 'Upravit typ testu' : 'Přidat typ testu'}
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
            placeholder="Např. COVID-19 Antigen Test"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Patogeny (které tento test detekuje)
          </label>
          {loadingPathogens ? (
            <p className="mt-1 text-sm text-gray-500">Načítání patogenů...</p>
          ) : (
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
              {pathogens.length === 0 ? (
                <p className="text-sm text-gray-500">Žádné patogeny k dispozici</p>
              ) : (
                pathogens.map((pathogen) => (
                  <label
                    key={pathogen.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPathogenIds.includes(pathogen.id)}
                      onChange={() => handlePathogenToggle(pathogen.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{pathogen.name}</span>
                  </label>
                ))
              )}
            </div>
          )}
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
            {loading ? 'Ukládání...' : testType ? 'Uložit změny' : 'Vytvořit'}
          </button>
        </div>
      </form>
    </div>
  );
}

