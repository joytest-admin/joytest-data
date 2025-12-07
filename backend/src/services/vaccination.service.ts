/**
 * Vaccination service
 * Contains business logic for vaccination operations
 */

import {
  CreateVaccinationRequest,
  UpdateVaccinationRequest,
  VaccinationResponse,
} from '../types/test.types';
import {
  createVaccination,
  updateVaccination,
  deleteVaccination,
  findAllVaccinations,
  findVaccinationById,
} from '../queries/vaccination.queries';
import { NotFoundError } from '../utils/errors';
import { getLocalizedNames } from './localization.service';
import { TranslationEntityType } from '../types/translation.types';

/**
 * Get all vaccinations
 * @param languageCode - Optional language code for translation
 * @returns Array of vaccination responses
 */
export const getAllVaccinations = async (languageCode?: string): Promise<VaccinationResponse[]> => {
  const vaccinations = await findAllVaccinations();
  const result = vaccinations.map((vaccination) => ({
    id: vaccination.id,
    name: vaccination.name,
    createdAt: vaccination.createdAt,
    updatedAt: vaccination.updatedAt,
  }));

  // Apply localization if language code is provided
  if (languageCode) {
    return await getLocalizedNames(result, TranslationEntityType.VACCINATION, languageCode);
  }

  return result;
};

/**
 * Get vaccination by ID
 * @param id - Vaccination ID
 * @returns Vaccination response
 */
export const getVaccinationById = async (id: string): Promise<VaccinationResponse> => {
  const vaccination = await findVaccinationById(id);
  if (!vaccination) {
    throw new NotFoundError('Vaccination not found');
  }

  return {
    id: vaccination.id,
    name: vaccination.name,
    createdAt: vaccination.createdAt,
    updatedAt: vaccination.updatedAt,
  };
};

/**
 * Create a new vaccination (admin only)
 * @param data - Vaccination creation data
 * @returns Created vaccination response
 */
export const createVaccinationService = async (
  data: CreateVaccinationRequest,
): Promise<VaccinationResponse> => {
  const vaccination = await createVaccination(data.name);

  return {
    id: vaccination.id,
    name: vaccination.name,
    createdAt: vaccination.createdAt,
    updatedAt: vaccination.updatedAt,
  };
};

/**
 * Update a vaccination (admin only)
 * @param id - Vaccination ID
 * @param data - Vaccination update data
 * @returns Updated vaccination response
 */
export const updateVaccinationService = async (
  id: string,
  data: UpdateVaccinationRequest,
): Promise<VaccinationResponse> => {
  if (!data.name) {
    throw new Error('Name is required for update');
  }

  const vaccination = await updateVaccination(id, data.name);

  return {
    id: vaccination.id,
    name: vaccination.name,
    createdAt: vaccination.createdAt,
    updatedAt: vaccination.updatedAt,
  };
};

/**
 * Delete a vaccination (admin only)
 * @param id - Vaccination ID
 * @returns True if deleted successfully
 */
export const deleteVaccinationService = async (id: string): Promise<boolean> => {
  return await deleteVaccination(id);
};

