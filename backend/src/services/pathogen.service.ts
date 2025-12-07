/**
 * Pathogen service
 * Contains business logic for pathogen operations
 */

import {
  CreatePathogenRequest,
  UpdatePathogenRequest,
  PathogenResponse,
} from '../types/pathogen.types';
import {
  createPathogen,
  updatePathogen,
  deletePathogen,
  findAllPathogens,
  findPathogenById,
} from '../queries/pathogen.queries';
import { getLocalizedNames } from './localization.service';
import { TranslationEntityType } from '../types/translation.types';

/**
 * Get all pathogens
 * @param languageCode - Optional language code for translation
 * @returns Array of pathogen responses
 */
export const getAllPathogens = async (languageCode?: string): Promise<PathogenResponse[]> => {
  const pathogens = await findAllPathogens();
  const result = pathogens.map((pathogen) => ({
    id: pathogen.id,
    name: pathogen.name,
    createdAt: pathogen.createdAt,
    updatedAt: pathogen.updatedAt,
  }));

  // Apply localization if language code is provided
  if (languageCode) {
    return await getLocalizedNames(result, TranslationEntityType.PATHOGEN, languageCode);
  }

  return result;
};

/**
 * Get pathogen by ID
 * @param id - Pathogen ID
 * @returns Pathogen response
 */
export const getPathogenById = async (id: string): Promise<PathogenResponse> => {
  const pathogen = await findPathogenById(id);
  if (!pathogen) {
    throw new Error('Pathogen not found');
  }

  return {
    id: pathogen.id,
    name: pathogen.name,
    createdAt: pathogen.createdAt,
    updatedAt: pathogen.updatedAt,
  };
};

/**
 * Create a new pathogen (admin only)
 * @param data - Pathogen creation data
 * @returns Created pathogen response
 */
export const createPathogenService = async (data: CreatePathogenRequest): Promise<PathogenResponse> => {
  const pathogen = await createPathogen(data.name);
  return {
    id: pathogen.id,
    name: pathogen.name,
    createdAt: pathogen.createdAt,
    updatedAt: pathogen.updatedAt,
  };
};

/**
 * Update a pathogen (admin only)
 * @param id - Pathogen ID
 * @param data - Pathogen update data
 * @returns Updated pathogen response
 */
export const updatePathogenService = async (
  id: string,
  data: UpdatePathogenRequest,
): Promise<PathogenResponse> => {
  if (!data.name) {
    throw new Error('Name is required');
  }

  const pathogen = await updatePathogen(id, data.name);
  return {
    id: pathogen.id,
    name: pathogen.name,
    createdAt: pathogen.createdAt,
    updatedAt: pathogen.updatedAt,
  };
};

/**
 * Delete a pathogen (admin only)
 * @param id - Pathogen ID
 * @returns True if deleted successfully
 */
export const deletePathogenService = async (id: string): Promise<boolean> => {
  return await deletePathogen(id);
};

