/**
 * Translation service
 * Business logic for translation operations
 */

import {
  CreateTranslationRequest,
  UpdateTranslationRequest,
  TranslationResponse,
  TranslationEntityType,
} from '../types/translation.types';
import {
  createTranslation,
  updateTranslation,
  deleteTranslation,
  findTranslationById,
  findTranslationsByEntity,
  findTranslationByEntityAndLanguage,
  findAllTranslationsWithEntityNames,
} from '../queries/translation.queries';
import { BadRequestError, NotFoundError } from '../utils/errors';

/**
 * Convert TranslationEntity to TranslationResponse
 */
const toTranslationResponse = (entity: any): TranslationResponse => {
  return {
    id: entity.id,
    entityType: entity.entityType,
    entityId: entity.entityId,
    languageCode: entity.languageCode,
    translation: entity.translation,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
};

/**
 * Get all translations with optional entity type and language code filters
 * @param entityType - Optional entity type filter
 * @param languageCode - Optional language code filter
 * @returns Array of translations with entity names
 */
export const getAllTranslations = async (
  entityType?: TranslationEntityType,
  languageCode?: string,
): Promise<Array<TranslationResponse & { entityName: string }>> => {
  const translations = await findAllTranslationsWithEntityNames(entityType, languageCode);
  return translations.map((t) => ({
    ...toTranslationResponse(t),
    entityName: t.entityName,
  }));
};

/**
 * Get translation by ID
 * @param id - Translation ID
 * @returns Translation response
 */
export const getTranslationById = async (id: string): Promise<TranslationResponse> => {
  const translation = await findTranslationById(id);
  if (!translation) {
    throw new NotFoundError('Translation not found');
  }
  return toTranslationResponse(translation);
};

/**
 * Get translations by entity
 * @param entityType - Entity type
 * @param entityId - Entity ID
 * @returns Array of translation responses
 */
export const getTranslationsByEntity = async (
  entityType: TranslationEntityType,
  entityId: string,
): Promise<TranslationResponse[]> => {
  const translations = await findTranslationsByEntity(entityType, entityId);
  return translations.map(toTranslationResponse);
};

/**
 * Create a new translation
 * @param data - Translation data
 * @returns Created translation response
 */
export const createTranslationService = async (
  data: CreateTranslationRequest,
): Promise<TranslationResponse> => {
  // Validate language code format (basic validation)
  if (!data.languageCode || data.languageCode.trim().length === 0) {
    throw new BadRequestError('Language code is required');
  }

  if (data.languageCode.length > 10) {
    throw new BadRequestError('Language code must be at most 10 characters');
  }

  // Validate translation text
  if (!data.translation || data.translation.trim().length === 0) {
    throw new BadRequestError('Translation text is required');
  }

  if (data.translation.length > 255) {
    throw new BadRequestError('Translation text must be at most 255 characters');
  }

  // Validate entity type
  if (!Object.values(TranslationEntityType).includes(data.entityType)) {
    throw new BadRequestError('Invalid entity type');
  }

  // Check if translation already exists
  const existing = await findTranslationByEntityAndLanguage(
    data.entityType,
    data.entityId,
    data.languageCode,
  );

  if (existing) {
    throw new BadRequestError(
      `Translation for ${data.entityType} ${data.entityId} in language ${data.languageCode} already exists`,
    );
  }

  const translation = await createTranslation(data);
  return toTranslationResponse(translation);
};

/**
 * Update a translation
 * @param id - Translation ID
 * @param data - Updated translation data
 * @returns Updated translation response
 */
export const updateTranslationService = async (
  id: string,
  data: UpdateTranslationRequest,
): Promise<TranslationResponse> => {
  if (data.translation === undefined) {
    throw new BadRequestError('Translation text is required');
  }

  if (data.translation.trim().length === 0) {
    throw new BadRequestError('Translation text cannot be empty');
  }

  if (data.translation.length > 255) {
    throw new BadRequestError('Translation text must be at most 255 characters');
  }

  const translation = await updateTranslation(id, data.translation);
  return toTranslationResponse(translation);
};

/**
 * Delete a translation
 * @param id - Translation ID
 * @returns True if deleted successfully
 */
export const deleteTranslationService = async (id: string): Promise<boolean> => {
  const translation = await findTranslationById(id);
  if (!translation) {
    throw new NotFoundError('Translation not found');
  }

  return await deleteTranslation(id);
};

