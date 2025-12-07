/**
 * Translation-related type definitions
 */

/**
 * Entity types that can have translations
 */
export enum TranslationEntityType {
  TEST_TYPE = 'test_type',
  VACCINATION = 'vaccination',
  COMMON_SYMPTOM = 'common_symptom',
  PATHOGEN = 'pathogen',
}

/**
 * Translation entity (stored in database)
 */
export interface TranslationEntity {
  id: string;
  entityType: TranslationEntityType;
  entityId: string;
  languageCode: string;
  translation: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create translation request (admin only)
 */
export interface CreateTranslationRequest {
  entityType: TranslationEntityType;
  entityId: string;
  languageCode: string;
  translation: string;
}

/**
 * Update translation request (admin only)
 */
export interface UpdateTranslationRequest {
  translation?: string;
}

/**
 * Translation response (for API)
 */
export interface TranslationResponse {
  id: string;
  entityType: TranslationEntityType;
  entityId: string;
  languageCode: string;
  translation: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Translation with entity name (for admin UI)
 */
export interface TranslationWithEntityName extends TranslationResponse {
  entityName: string; // Name of the original entity
}

