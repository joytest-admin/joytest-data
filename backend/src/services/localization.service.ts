/**
 * Localization service
 * Handles translation lookup for entities
 */

import { TranslationEntityType } from '../types/translation.types';
import { findTranslationByEntityAndLanguage } from '../queries/translation.queries';

/**
 * Get translated name for an entity
 * If translation exists for the given language code, returns the translation
 * Otherwise returns the original name
 * @param entityType - Type of entity (test_type, vaccination, common_symptom, pathogen)
 * @param entityId - ID of the entity
 * @param originalName - Original name of the entity
 * @param languageCode - Language code (e.g., 'en-US', 'cs-CZ')
 * @returns Translated name if found, otherwise original name
 */
export const getLocalizedName = async (
  entityType: TranslationEntityType,
  entityId: string,
  originalName: string,
  languageCode?: string,
): Promise<string> => {
  // If no language code provided, return original name
  if (!languageCode) {
    return originalName;
  }

  try {
    // Look up translation in database
    const translation = await findTranslationByEntityAndLanguage(
      entityType,
      entityId,
      languageCode,
    );

    // If translation found, return it; otherwise return original name
    return translation?.translation || originalName;
  } catch (error) {
    // If error occurs, return original name
    console.error(`Error fetching translation for ${entityType} ${entityId}:`, error);
    return originalName;
  }
};

/**
 * Get translated names for multiple entities
 * @param entities - Array of entities with id and name
 * @param entityType - Type of entity
 * @param languageCode - Language code (optional)
 * @returns Array of entities with translated names
 */
export const getLocalizedNames = async <T extends { id: string; name: string }>(
  entities: T[],
  entityType: TranslationEntityType,
  languageCode?: string,
): Promise<T[]> => {
  // If no language code provided, return original entities
  if (!languageCode) {
    return entities;
  }

  // Get translations for all entities in parallel
  const localizedEntities = await Promise.all(
    entities.map(async (entity) => {
      const translatedName = await getLocalizedName(
        entityType,
        entity.id,
        entity.name,
        languageCode,
      );
      return {
        ...entity,
        name: translatedName,
      };
    }),
  );

  return localizedEntities;
};

