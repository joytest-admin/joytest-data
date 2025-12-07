'use client';

/**
 * Translation form component
 * Form for creating and editing translations
 */

import { useState, useEffect } from 'react';
import {
  Translation,
  TranslationEntityType,
  TestType,
  Vaccination,
  CommonSymptom,
  Pathogen,
} from '@/src/types/api.types';

interface TranslationFormProps {
  translation: Translation | null;
  entities: {
    testTypes: TestType[];
    vaccinations: Vaccination[];
    commonSymptoms: CommonSymptom[];
    pathogens: Pathogen[];
  };
  onSubmit: (data: {
    entityType: TranslationEntityType;
    entityId: string;
    languageCode: string;
    translation: string;
  }) => void;
  onCancel: () => void;
  loading: boolean;
}

export default function TranslationForm({
  translation,
  entities,
  onSubmit,
  onCancel,
  loading,
}: TranslationFormProps) {
  const [entityType, setEntityType] = useState<TranslationEntityType>(
    translation?.entityType || 'test_type',
  );
  const [entityId, setEntityId] = useState(translation?.entityId || '');
  const [languageCode, setLanguageCode] = useState(translation?.languageCode || '');
  const [translationText, setTranslationText] = useState(translation?.translation || '');

  // Reset entityId when entityType changes
  useEffect(() => {
    setEntityId('');
  }, [entityType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entityId && languageCode.trim() && translationText.trim()) {
      onSubmit({
        entityType,
        entityId,
        languageCode: languageCode.trim(),
        translation: translationText.trim(),
      });
    }
  };

  const getAvailableEntities = () => {
    switch (entityType) {
      case 'test_type':
        return entities.testTypes;
      case 'vaccination':
        return entities.vaccinations;
      case 'common_symptom':
        return entities.commonSymptoms;
      case 'pathogen':
        return entities.pathogens;
      default:
        return [];
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

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {translation ? 'Upravit překlad' : 'Přidat nový překlad'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="entityType" className="block text-sm font-medium text-gray-700 mb-1">
            Typ entity *
          </label>
          <select
            id="entityType"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value as TranslationEntityType)}
            disabled={!!translation} // Cannot change entity type when editing
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="test_type">Typ testu</option>
            <option value="vaccination">Vakcína</option>
            <option value="common_symptom">Běžný příznak</option>
            <option value="pathogen">Patogen</option>
          </select>
        </div>

        <div>
          <label htmlFor="entityId" className="block text-sm font-medium text-gray-700 mb-1">
            {getEntityTypeLabel(entityType)} *
          </label>
          <select
            id="entityId"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            disabled={!!translation} // Cannot change entity when editing
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">Vyberte {getEntityTypeLabel(entityType).toLowerCase()}</option>
            {getAvailableEntities().map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="languageCode" className="block text-sm font-medium text-gray-700 mb-1">
            Jazykový kód *
          </label>
          <input
            id="languageCode"
            type="text"
            value={languageCode}
            onChange={(e) => setLanguageCode(e.target.value)}
            disabled={!!translation} // Cannot change language code when editing
            placeholder="např. en-US, cs-CZ"
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
            maxLength={10}
          />
        </div>

        <div>
          <label htmlFor="translation" className="block text-sm font-medium text-gray-700 mb-1">
            Překlad *
          </label>
          <input
            id="translation"
            type="text"
            value={translationText}
            onChange={(e) => setTranslationText(e.target.value)}
            placeholder="Zadejte překlad"
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            maxLength={255}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Zrušit
          </button>
          <button
            type="submit"
            disabled={loading || !entityId || !languageCode.trim() || !translationText.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ukládání...' : translation ? 'Uložit změny' : 'Vytvořit'}
          </button>
        </div>
      </form>
    </div>
  );
}

