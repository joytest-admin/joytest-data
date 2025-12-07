/**
 * Common symptom service
 * Contains business logic for common symptom operations
 */

import {
  CreateCommonSymptomRequest,
  UpdateCommonSymptomRequest,
  CommonSymptomResponse,
} from '../types/test.types';
import {
  createCommonSymptom,
  updateCommonSymptom,
  deleteCommonSymptom,
  findAllCommonSymptoms,
  findCommonSymptomById,
} from '../queries/common-symptom.queries';
import { NotFoundError } from '../utils/errors';
import { getLocalizedNames } from './localization.service';
import { TranslationEntityType } from '../types/translation.types';

/**
 * Get all common symptoms
 * @param languageCode - Optional language code for translation
 * @returns Array of common symptom responses
 */
export const getAllCommonSymptoms = async (languageCode?: string): Promise<CommonSymptomResponse[]> => {
  const commonSymptoms = await findAllCommonSymptoms();
  const result = commonSymptoms.map((symptom) => ({
    id: symptom.id,
    name: symptom.name,
    createdAt: symptom.createdAt,
    updatedAt: symptom.updatedAt,
  }));

  // Apply localization if language code is provided
  if (languageCode) {
    return await getLocalizedNames(result, TranslationEntityType.COMMON_SYMPTOM, languageCode);
  }

  return result;
};

/**
 * Get common symptom by ID
 * @param id - Common symptom ID
 * @returns Common symptom response
 */
export const getCommonSymptomById = async (id: string): Promise<CommonSymptomResponse> => {
  const symptom = await findCommonSymptomById(id);
  if (!symptom) {
    throw new NotFoundError('Common symptom not found');
  }

  return {
    id: symptom.id,
    name: symptom.name,
    createdAt: symptom.createdAt,
    updatedAt: symptom.updatedAt,
  };
};

/**
 * Create a new common symptom (admin only)
 * @param data - Common symptom creation data
 * @returns Created common symptom response
 */
export const createCommonSymptomService = async (
  data: CreateCommonSymptomRequest,
): Promise<CommonSymptomResponse> => {
  const symptom = await createCommonSymptom(data.name);

  return {
    id: symptom.id,
    name: symptom.name,
    createdAt: symptom.createdAt,
    updatedAt: symptom.updatedAt,
  };
};

/**
 * Update a common symptom (admin only)
 * @param id - Common symptom ID
 * @param data - Common symptom update data
 * @returns Updated common symptom response
 */
export const updateCommonSymptomService = async (
  id: string,
  data: UpdateCommonSymptomRequest,
): Promise<CommonSymptomResponse> => {
  if (!data.name) {
    throw new Error('Name is required for update');
  }

  const symptom = await updateCommonSymptom(id, data.name);

  return {
    id: symptom.id,
    name: symptom.name,
    createdAt: symptom.createdAt,
    updatedAt: symptom.updatedAt,
  };
};

/**
 * Delete a common symptom (admin only)
 * @param id - Common symptom ID
 * @returns True if deleted successfully
 */
export const deleteCommonSymptomService = async (id: string): Promise<boolean> => {
  return await deleteCommonSymptom(id);
};

