/**
 * Test type service
 * Contains business logic for test type operations
 */

import {
  CreateTestTypeRequest,
  UpdateTestTypeRequest,
  TestTypeResponse,
} from '../types/test.types';
import {
  createTestType,
  updateTestType,
  deleteTestType,
  findAllTestTypes,
  findTestTypeById,
} from '../queries/test-type.queries';
import { findPathogensByTestType, setTestTypePathogens } from '../queries/pathogen.queries';
import { NotFoundError } from '../utils/errors';
import { getLocalizedNames } from './localization.service';
import { TranslationEntityType } from '../types/translation.types';

/**
 * Get all test types
 * @param languageCode - Optional language code for translation
 * @returns Array of test type responses
 */
export const getAllTestTypes = async (languageCode?: string): Promise<TestTypeResponse[]> => {
  const testTypes = await findAllTestTypes();
  const result = await Promise.all(
    testTypes.map(async (testType) => {
      const pathogens = await findPathogensByTestType(testType.id);
      return {
        id: testType.id,
        name: testType.name,
        pathogenIds: pathogens.map((p) => p.id),
        createdAt: testType.createdAt,
        updatedAt: testType.updatedAt,
      };
    }),
  );

  // Apply localization if language code is provided
  if (languageCode) {
    return await getLocalizedNames(result, TranslationEntityType.TEST_TYPE, languageCode);
  }

  return result;
};

/**
 * Get test type by ID
 * @param id - Test type ID
 * @returns Test type response
 */
export const getTestTypeById = async (id: string): Promise<TestTypeResponse> => {
  const testType = await findTestTypeById(id);
  if (!testType) {
    throw new NotFoundError('Test type not found');
  }

  const pathogens = await findPathogensByTestType(id);
  return {
    id: testType.id,
    name: testType.name,
    pathogenIds: pathogens.map((p) => p.id),
    createdAt: testType.createdAt,
    updatedAt: testType.updatedAt,
  };
};

/**
 * Create a new test type (admin only)
 * @param data - Test type creation data
 * @returns Created test type response
 */
export const createTestTypeService = async (
  data: CreateTestTypeRequest,
): Promise<TestTypeResponse> => {
  const testType = await createTestType(data.name);

  // Set pathogen associations if provided
  if (data.pathogenIds && data.pathogenIds.length > 0) {
    await setTestTypePathogens(testType.id, data.pathogenIds);
  }

  const pathogens = await findPathogensByTestType(testType.id);
  return {
    id: testType.id,
    name: testType.name,
    pathogenIds: pathogens.map((p) => p.id),
    createdAt: testType.createdAt,
    updatedAt: testType.updatedAt,
  };
};

/**
 * Update a test type (admin only)
 * @param id - Test type ID
 * @param data - Test type update data
 * @returns Updated test type response
 */
export const updateTestTypeService = async (
  id: string,
  data: UpdateTestTypeRequest,
): Promise<TestTypeResponse> => {
  // Update name if provided
  if (data.name) {
    await updateTestType(id, data.name);
  }

  // Update pathogen associations if provided
  if (data.pathogenIds !== undefined) {
    await setTestTypePathogens(id, data.pathogenIds);
  }

  const testType = await findTestTypeById(id);
  if (!testType) {
    throw new NotFoundError('Test type not found');
  }

  const pathogens = await findPathogensByTestType(id);
  return {
    id: testType.id,
    name: testType.name,
    pathogenIds: pathogens.map((p) => p.id),
    createdAt: testType.createdAt,
    updatedAt: testType.updatedAt,
  };
};

/**
 * Delete a test type (admin only)
 * @param id - Test type ID
 * @returns True if deleted successfully
 */
export const deleteTestTypeService = async (id: string): Promise<boolean> => {
  return await deleteTestType(id);
};

