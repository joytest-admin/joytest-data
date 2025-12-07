/**
 * Translation validators
 * Validates request data for translation endpoints
 */

import { body, param, query } from 'express-validator';
import { TranslationEntityType } from '../../types/translation.types';

/**
 * Validator for creating a translation
 */
export const createTranslationValidator = [
  body('entityType')
    .notEmpty()
    .withMessage('Entity type is required')
    .isIn(Object.values(TranslationEntityType))
    .withMessage(`Entity type must be one of: ${Object.values(TranslationEntityType).join(', ')}`),
  body('entityId')
    .notEmpty()
    .withMessage('Entity ID is required')
    .isUUID()
    .withMessage('Entity ID must be a valid UUID'),
  body('languageCode')
    .notEmpty()
    .withMessage('Language code is required')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Language code must be between 1 and 10 characters'),
  body('translation')
    .notEmpty()
    .withMessage('Translation text is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Translation text must be between 1 and 255 characters'),
];

/**
 * Validator for updating a translation
 */
export const updateTranslationValidator = [
  param('id').isUUID().withMessage('Translation ID must be a valid UUID'),
  body('translation')
    .notEmpty()
    .withMessage('Translation text is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Translation text must be between 1 and 255 characters'),
];

/**
 * Validator for getting translations by entity type (optional filter)
 */
export const getTranslationsValidator = [
  query('entityType')
    .optional()
    .isIn(Object.values(TranslationEntityType))
    .withMessage(`Entity type must be one of: ${Object.values(TranslationEntityType).join(', ')}`),
  query('languageCode')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Language code must be between 1 and 10 characters'),
];

/**
 * Validator for getting translations by entity
 */
export const getTranslationsByEntityValidator = [
  param('entityType')
    .isIn(Object.values(TranslationEntityType))
    .withMessage(`Entity type must be one of: ${Object.values(TranslationEntityType).join(', ')}`),
  param('entityId').isUUID().withMessage('Entity ID must be a valid UUID'),
];

