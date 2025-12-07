'use client';

/**
 * Translations list component
 * Displays and manages translations with CRUD operations
 */

import { useState, useEffect } from 'react';
import { Translation, TranslationEntityType, TestType, Vaccination, CommonSymptom, Pathogen } from '@/src/types/api.types';
import { get, post, put, del } from '@/src/lib/api-client';
import TranslationForm from './TranslationForm';

interface TranslationsListProps {
  initialTranslations: Translation[];
}

export default function TranslationsList({ initialTranslations }: TranslationsListProps) {
  const [translations, setTranslations] = useState<Translation[]>(initialTranslations);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterEntityType, setFilterEntityType] = useState<TranslationEntityType | ''>('');
  const [filterLanguageCode, setFilterLanguageCode] = useState('');
  const [entities, setEntities] = useState<{
    testTypes: TestType[];
    vaccinations: Vaccination[];
    commonSymptoms: CommonSymptom[];
    pathogens: Pathogen[];
  }>({
    testTypes: [],
    vaccinations: [],
    commonSymptoms: [],
    pathogens: [],
  });

  // Load entities for dropdowns
  useEffect(() => {
    const loadEntities = async () => {
      try {
        const [testTypesRes, vaccinationsRes, symptomsRes, pathogensRes] = await Promise.all([
          get<TestType[]>('/test-types'),
          get<Vaccination[]>('/vaccinations'),
          get<CommonSymptom[]>('/common-symptoms'),
          get<Pathogen[]>('/pathogens'),
        ]);

        setEntities({
          testTypes: testTypesRes.success && testTypesRes.data ? testTypesRes.data : [],
          vaccinations: vaccinationsRes.success && vaccinationsRes.data ? vaccinationsRes.data : [],
          commonSymptoms: symptomsRes.success && symptomsRes.data ? symptomsRes.data : [],
          pathogens: pathogensRes.success && pathogensRes.data ? pathogensRes.data : [],
        });
      } catch (err) {
        console.error('Failed to load entities:', err);
      }
    };

    loadEntities();
  }, []);

  // Reload translations when filter changes
  useEffect(() => {
    const loadTranslations = async () => {
      setLoading(true);
      setError('');

      try {
        const queryParams = new URLSearchParams();
        if (filterEntityType) queryParams.append('entityType', filterEntityType);
        if (filterLanguageCode.trim()) queryParams.append('languageCode', filterLanguageCode.trim());

        const response = await get<Translation[]>(`/translations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
        if (response.success && response.data) {
          setTranslations(response.data);
        } else {
          setError(response.error?.message || 'Nepodařilo se načíst překlady');
        }
      } catch (err: any) {
        setError(err.message || 'Nepodařilo se načíst překlady');
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [filterEntityType, filterLanguageCode]);

  const handleCreate = () => {
    setEditingTranslation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (translation: Translation) => {
    setEditingTranslation(translation);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tento překlad?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await del(`/translations/${id}`);
      if (response.success) {
        setTranslations(translations.filter((t) => t.id !== id));
      } else {
        setError(response.error?.message || 'Nepodařilo se smazat překlad');
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se smazat překlad');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: {
    entityType: TranslationEntityType;
    entityId: string;
    languageCode: string;
    translation: string;
  }) => {
    setLoading(true);
    setError('');

    try {
      if (editingTranslation) {
        // Update
        const response = await put<Translation>(`/translations/${editingTranslation.id}`, {
          translation: data.translation,
        });
        if (response.success && response.data) {
          const updatedTranslation = response.data;
          setTranslations(
            translations.map((t) => (t.id === editingTranslation.id ? updatedTranslation : t)),
          );
          setIsFormOpen(false);
          setEditingTranslation(null);
        } else {
          setError(response.error?.message || 'Nepodařilo se aktualizovat překlad');
        }
      } else {
        // Create
        const response = await post<Translation>('/translations', data);
        if (response.success && response.data) {
          const newTranslation = response.data;
          setTranslations([...translations, newTranslation]);
          setIsFormOpen(false);
        } else {
          setError(response.error?.message || 'Nepodařilo se vytvořit překlad');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Operace selhala');
    } finally {
      setLoading(false);
    }
  };

  const getEntityName = (translation: Translation): string => {
    if (translation.entityName) return translation.entityName;

    switch (translation.entityType) {
      case 'test_type':
        return entities.testTypes.find((e) => e.id === translation.entityId)?.name || translation.entityId;
      case 'vaccination':
        return entities.vaccinations.find((e) => e.id === translation.entityId)?.name || translation.entityId;
      case 'common_symptom':
        return entities.commonSymptoms.find((e) => e.id === translation.entityId)?.name || translation.entityId;
      case 'pathogen':
        return entities.pathogens.find((e) => e.id === translation.entityId)?.name || translation.entityId;
      default:
        return translation.entityId;
    }
  };

  const getEntityTypeLabel = (type: TranslationEntityType): string => {
    switch (type) {
      case 'test_type':
        return 'Typ testu';
      case 'vaccination':
        return 'Vakcína';
      case 'common_symptom':
        return 'Běžný příznak';
      case 'pathogen':
        return 'Patogen';
      default:
        return type;
    }
  };

  // Translations are already filtered server-side

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value as TranslationEntityType | '')}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Všechny typy entit</option>
            <option value="test_type">Typy testů</option>
            <option value="vaccination">Vakcíny</option>
            <option value="common_symptom">Běžné příznaky</option>
            <option value="pathogen">Patogeny</option>
          </select>
          <input
            type="text"
            value={filterLanguageCode}
            onChange={(e) => setFilterLanguageCode(e.target.value)}
            placeholder="Filtrovat podle jazykového kódu..."
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Přidat překlad
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {isFormOpen && (
        <TranslationForm
          translation={editingTranslation}
          entities={entities}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingTranslation(null);
          }}
          loading={loading}
        />
      )}

      {loading && !isFormOpen ? (
        <div className="text-center py-8 text-gray-500">Načítání...</div>
      ) : translations.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-8 text-center text-gray-500">
          Žádné překlady nenalezeny
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Typ entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Entita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Jazykový kód
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Překlad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {translations.map((translation) => (
                <tr key={translation.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {getEntityTypeLabel(translation.entityType)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {getEntityName(translation)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {translation.languageCode}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{translation.translation}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => handleEdit(translation)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Upravit
                    </button>
                    <button
                      onClick={() => handleDelete(translation.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Smazat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

