/**
 * Test result service
 * Contains business logic for test result operations
 */

import {
  CreateTestResultRequest,
  UpdateTestResultRequest,
  TestResultResponse,
} from '../types/test.types';
import {
  createTestResult,
  updateTestResult,
  deleteTestResult,
  findAllTestResults,
  findTestResultById,
  findDoctorTestResults,
  findDoctorTestResultsByInterval,
  findDoctorTestResultsByPatient,
  findAdminTestResults,
  findAdminTestResultsForExport,
  findTestResultVaccinationsByTestResultId,
  createTestResultVaccination,
  deleteTestResultVaccinationsByTestResultId,
} from '../queries/test-result.queries';
import { findTestTypeById } from '../queries/test-type.queries';
import { findVaccinationById } from '../queries/vaccination.queries';
import { findPathogenById } from '../queries/pathogen.queries';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { findPatientById } from '../queries/patient.queries';

/**
 * Get all test results
 * @param userId - Optional user ID to filter by creator (for doctors to see only their results)
 * @param limit - Optional limit for pagination
 * @param offset - Optional offset for pagination
 * @returns Array of test result responses
 */
export const getAllTestResults = async (
  userId?: string,
  limit?: number,
  offset?: number,
): Promise<TestResultResponse[]> => {
  return await findAllTestResults(userId, limit, offset);
};

/**
 * Get test results for a doctor with search, sorting, and pagination
 * @param doctorId - Doctor user ID
 * @param options - Search, pagination, and sorting options
 * @returns Object with test results and total count
 */
export const getDoctorTestResults = async (
  doctorId: string,
  options: {
    search?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: 'created_at' | 'date_of_birth' | 'city' | 'test_type_name' | 'pathogen_name' | 'patient_identifier';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {},
): Promise<{ results: TestResultResponse[]; total: number }> => {
  // Validate dates if provided
  if (options.startDate) {
    const start = new Date(options.startDate);
    if (isNaN(start.getTime())) {
      throw new BadRequestError('Invalid start date format');
    }
  }

  if (options.endDate) {
    const end = new Date(options.endDate);
    if (isNaN(end.getTime())) {
      throw new BadRequestError('Invalid end date format');
    }
  }

  if (options.startDate && options.endDate) {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);
    if (start > end) {
      throw new BadRequestError('Start date must be before end date');
    }
  }

  return await findDoctorTestResults(doctorId, options);
};

/**
 * Get test result by ID
 * @param id - Test result ID
 * @param userId - Optional user ID to verify ownership (for doctors)
 * @returns Test result response
 */
export const getTestResultById = async (
  id: string,
  userId?: string,
): Promise<TestResultResponse> => {
  const testResult = await findTestResultById(id);
  if (!testResult) {
    throw new NotFoundError('Test result not found');
  }

  // If userId is provided, verify ownership (for doctors)
  if (userId && testResult.createdBy !== userId) {
    throw new ForbiddenError('You do not have permission to access this test result');
  }

  // Fetch joined data
  const testType = await findTestTypeById(testResult.testTypeId);

  // Load vaccinations for response
  const vaccinations = await findTestResultVaccinationsByTestResultId(testResult.id);
  const vaccinationResponses = await Promise.all(
    vaccinations.map(async (v) => {
      const vaccinationEntity = await findVaccinationById(v.vaccinationId);
      return {
        id: v.id,
        vaccinationId: v.vaccinationId,
        vaccinationName: vaccinationEntity?.name,
        vaccineName: v.vaccineName,
        batchNumber: v.batchNumber,
        vaccinationDate: v.vaccinationDate ? v.vaccinationDate.toISOString() : null,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      };
    }),
  );

  return {
    id: testResult.id,
    cityId: testResult.cityId,
    icpNumber: testResult.icpNumber,
    testTypeId: testResult.testTypeId,
    testTypeName: testType?.name,
    dateOfBirth: testResult.dateOfBirth,
    testDate: testResult.testDate,
    symptoms: testResult.symptoms,
    pathogenId: testResult.pathogenId,
    pathogenName: testResult.pathogenId
      ? (await findPathogenById(testResult.pathogenId))?.name || null
      : null,
    otherInformations: testResult.otherInformations,
    sari: testResult.sari,
    atb: testResult.atb,
    antivirals: testResult.antivirals,
    obesity: testResult.obesity,
    respiratorySupport: testResult.respiratorySupport,
    ecmo: testResult.ecmo,
    pregnancy: testResult.pregnancy,
    trimester: testResult.trimester,
    vaccinations: vaccinationResponses,
    patientId: testResult.patientId,
    patientIdentifier: testResult.patientIdentifier || null,
    createdBy: testResult.createdBy,
    createdAt: testResult.createdAt,
    updatedAt: testResult.updatedAt,
  };
};

/**
 * Create a new test result (doctor/user only)
 * @param data - Test result creation data
 * @param userId - User ID of the creator
 * @returns Created test result response
 */
export const createTestResultService = async (
  data: CreateTestResultRequest,
  userId: string,
): Promise<TestResultResponse> => {
  // Validate test type exists
  const testType = await findTestTypeById(data.testTypeId);
  if (!testType) {
    throw new BadRequestError('Test type not found');
  }


  // Validate pathogen exists if provided
  if (data.pathogenId) {
    const pathogen = await findPathogenById(data.pathogenId);
    if (!pathogen) {
      throw new BadRequestError('Pathogen not found');
    }
  }

  // Validate city part exists
  const { getCityById } = await import('./geography.service');
  const city = await getCityById(data.cityId);
  if (!city) {
    throw new BadRequestError('City not found');
  }

  // Parse date of birth
  const dateOfBirth = new Date(data.dateOfBirth);
  if (isNaN(dateOfBirth.getTime())) {
    throw new BadRequestError('Invalid date of birth format');
  }

  // Parse test date
  const testDate = new Date(data.testDate);
  if (isNaN(testDate.getTime())) {
    throw new BadRequestError('Invalid test date format');
  }

  // Validate symptoms array (optional - can be empty or undefined)
  const symptoms = data.symptoms || []; // Default to empty array if undefined
  if (!Array.isArray(symptoms)) {
    throw new BadRequestError('Symptoms must be an array');
  }
  // If array is provided, validate its contents
  if (symptoms.length > 0 && !symptoms.every((item) => typeof item === 'string' && item.trim().length > 0)) {
    throw new BadRequestError('All symptoms must be non-empty strings');
  }

  // Validate trimester if provided
  if (data.trimester !== undefined) {
    if (data.trimester !== null && ![1, 2, 3].includes(data.trimester)) {
      throw new BadRequestError('Trimester must be 1, 2, or 3');
    }
    // If trimester is provided (not null), pregnancy should be true
    if (data.trimester !== null && data.pregnancy !== true) {
      throw new BadRequestError('Trimester can only be set when pregnancy is true');
    }
  }
  // If pregnancy is false and trimester is provided, that's invalid
  if (data.pregnancy === false && data.trimester !== undefined && data.trimester !== null) {
    throw new BadRequestError('Trimester cannot be set when pregnancy is false');
  }

  let patientIdentifier: string | null = null;
  let patientId: string | null = null;
  if (data.patientId) {
    const patient = await findPatientById(data.patientId);
    if (!patient) {
      throw new BadRequestError('Patient not found');
    }
    if (patient.doctorId !== userId) {
      throw new ForbiddenError('You do not have permission to use this patient');
    }
    patientId = patient.id;
    patientIdentifier = patient.identifier;
  }

  const testResult = await createTestResult(
    {
      cityId: data.cityId,
      icpNumber: data.icpNumber,
      testTypeId: data.testTypeId,
      dateOfBirth,
      testDate,
      symptoms: symptoms, // Use the normalized array (empty if undefined)
      pathogenId: data.pathogenId || null,
      otherInformations: data.otherInformations,
      sari: data.sari,
      atb: data.atb,
      antivirals: data.antivirals,
      obesity: data.obesity,
      respiratorySupport: data.respiratorySupport,
      ecmo: data.ecmo,
      pregnancy: data.pregnancy,
      trimester: data.trimester ?? null,
      patientId,
    },
    userId,
  );

  // Create vaccinations in test_result_vaccinations table
  if (data.vaccinations && data.vaccinations.length > 0) {
    for (const vaccination of data.vaccinations) {
      const vaccinationDate = vaccination.vaccinationDate ? new Date(vaccination.vaccinationDate) : null;
      await createTestResultVaccination({
        testResultId: testResult.id,
        vaccinationId: vaccination.vaccinationId,
        vaccineName: vaccination.vaccineName || null,
        batchNumber: vaccination.batchNumber || null,
        vaccinationDate: vaccinationDate,
      });
    }
  }

  // Get pathogen name if pathogenId exists
  const pathogen = testResult.pathogenId
    ? await findPathogenById(testResult.pathogenId)
    : null;

  // Load vaccinations for response
  const vaccinations = await findTestResultVaccinationsByTestResultId(testResult.id);
  const vaccinationResponses = await Promise.all(
    vaccinations.map(async (v) => {
      const vaccinationEntity = await findVaccinationById(v.vaccinationId);
      return {
        id: v.id,
        vaccinationId: v.vaccinationId,
        vaccinationName: vaccinationEntity?.name,
        vaccineName: v.vaccineName,
        batchNumber: v.batchNumber,
        vaccinationDate: v.vaccinationDate ? v.vaccinationDate.toISOString() : null,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      };
    }),
  );

  // Get vaccination name for backward compatibility
  const firstVaccination = vaccinations.length > 0
    ? await findVaccinationById(vaccinations[0].vaccinationId)
    : null;

  return {
    id: testResult.id,
    cityId: testResult.cityId,
    icpNumber: testResult.icpNumber,
    testTypeId: testResult.testTypeId,
    testTypeName: testType.name,
    dateOfBirth: testResult.dateOfBirth,
    testDate: testResult.testDate,
    symptoms: testResult.symptoms,
    pathogenId: testResult.pathogenId,
    pathogenName: pathogen?.name || null,
    otherInformations: testResult.otherInformations,
    sari: testResult.sari,
    atb: testResult.atb,
    antivirals: testResult.antivirals,
    obesity: testResult.obesity,
    respiratorySupport: testResult.respiratorySupport,
    ecmo: testResult.ecmo,
    pregnancy: testResult.pregnancy,
    trimester: testResult.trimester,
    vaccinations: vaccinationResponses,
    patientId: patientId,
    patientIdentifier: patientIdentifier,
    createdBy: testResult.createdBy,
    createdAt: testResult.createdAt,
    updatedAt: testResult.updatedAt,
  };
};

/**
 * Update a test result (doctor/user only)
 * @param id - Test result ID
 * @param data - Test result update data
 * @param userId - User ID of the updater (for ownership verification)
 * @returns Updated test result response
 */
export const updateTestResultService = async (
  id: string,
  data: UpdateTestResultRequest,
  userId: string,
): Promise<TestResultResponse> => {
  // Check if test result exists and user has permission
  const existing = await findTestResultById(id);
  if (!existing) {
    throw new NotFoundError('Test result not found');
  }

  // Verify ownership (doctors can only update their own results)
  if (existing.createdBy !== userId) {
    throw new ForbiddenError('You do not have permission to update this test result');
  }

  // Validate test type if provided
  if (data.testTypeId) {
    const testType = await findTestTypeById(data.testTypeId);
    if (!testType) {
      throw new BadRequestError('Test type not found');
    }
  }

  // Validate vaccinations array if provided
  if (data.vaccinations !== undefined) {
    if (!Array.isArray(data.vaccinations)) {
      throw new BadRequestError('Vaccinations must be an array');
    }
    // Validate each vaccination
    for (const vaccination of data.vaccinations) {
      if (!vaccination.vaccinationId) {
        throw new BadRequestError('Each vaccination must have a vaccinationId');
      }
      const vaccinationEntity = await findVaccinationById(vaccination.vaccinationId);
      if (!vaccinationEntity) {
        throw new BadRequestError(`Vaccination not found: ${vaccination.vaccinationId}`);
      }
      // Validate vaccination date if provided
      if (vaccination.vaccinationDate) {
        const vaccinationDate = new Date(vaccination.vaccinationDate);
        if (isNaN(vaccinationDate.getTime())) {
          throw new BadRequestError('Invalid vaccination date format');
        }
      }
    }
  }

  // Validate pathogen if provided
  if (data.pathogenId) {
    const pathogen = await findPathogenById(data.pathogenId);
    if (!pathogen) {
      throw new BadRequestError('Pathogen not found');
    }
  }

  // Validate city part if provided
  if (data.cityId !== undefined) {
    const { getCityById } = await import('./geography.service');
    const city = await getCityById(data.cityId);
    if (!city) {
      throw new BadRequestError('City part not found');
    }
  }

  // Parse date of birth if provided
  let dateOfBirth: Date | undefined;
  if (data.dateOfBirth) {
    dateOfBirth = new Date(data.dateOfBirth);
    if (isNaN(dateOfBirth.getTime())) {
      throw new BadRequestError('Invalid date of birth format');
    }
  }

  // Parse test date if provided
  let testDate: Date | undefined;
  if (data.testDate) {
    testDate = new Date(data.testDate);
    if (isNaN(testDate.getTime())) {
      throw new BadRequestError('Invalid test date format');
    }
  }

  const updateData: any = {};

  // Validate trimester if provided
  if (data.trimester !== undefined) {
    if (data.trimester !== null && ![1, 2, 3].includes(data.trimester)) {
      throw new BadRequestError('Trimester must be 1, 2, or 3');
    }
    // If trimester is provided (not null), pregnancy should be true
    if (data.trimester !== null && data.pregnancy !== true) {
      throw new BadRequestError('Trimester can only be set when pregnancy is true');
    }
  }
  // If pregnancy is set to false, clear trimester
  if (data.pregnancy === false && data.trimester === undefined) {
    updateData.trimester = null;
  }
  // If pregnancy is set to false and trimester is explicitly provided, that's invalid
  if (data.pregnancy === false && data.trimester !== undefined && data.trimester !== null) {
    throw new BadRequestError('Trimester cannot be set when pregnancy is false');
  }
  
  // Validate symptoms array if provided (optional - can be empty or undefined)
  if (data.symptoms !== undefined) {
    const symptoms = data.symptoms || []; // Default to empty array if null/undefined
    if (!Array.isArray(symptoms)) {
      throw new BadRequestError('Symptoms must be an array');
    }
    // If array is provided, validate its contents
    if (symptoms.length > 0 && !symptoms.every((item) => typeof item === 'string' && item.trim().length > 0)) {
      throw new BadRequestError('All symptoms must be non-empty strings');
    }
    // Always set symptoms (even if empty array) when provided
    updateData.symptoms = symptoms;
  }
  if (data.cityId !== undefined) updateData.cityId = data.cityId;
  if (data.icpNumber !== undefined) updateData.icpNumber = data.icpNumber;
  if (data.testTypeId !== undefined) updateData.testTypeId = data.testTypeId;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
  if (testDate !== undefined) updateData.testDate = testDate;
  if (data.pathogenId !== undefined) updateData.pathogenId = data.pathogenId;
  if (data.otherInformations !== undefined) updateData.otherInformations = data.otherInformations;
  if (data.sari !== undefined) updateData.sari = data.sari;
  if (data.atb !== undefined) updateData.atb = data.atb;
  if (data.antivirals !== undefined) updateData.antivirals = data.antivirals;
  if (data.obesity !== undefined) updateData.obesity = data.obesity;
  if (data.respiratorySupport !== undefined) updateData.respiratorySupport = data.respiratorySupport;
  if (data.ecmo !== undefined) updateData.ecmo = data.ecmo;
  if (data.pregnancy !== undefined) updateData.pregnancy = data.pregnancy;
  if (data.trimester !== undefined) updateData.trimester = data.trimester;
  let updatedPatientIdentifier: string | null | undefined;
  if (data.patientId !== undefined) {
    if (data.patientId === null) {
      updateData.patientId = null;
      updatedPatientIdentifier = null;
    } else {
      const patient = await findPatientById(data.patientId);
      if (!patient) {
        throw new BadRequestError('Patient not found');
      }
      if (patient.doctorId !== userId) {
        throw new ForbiddenError('You do not have permission to use this patient');
      }
      updateData.patientId = patient.id;
      updatedPatientIdentifier = patient.identifier;
    }
  }

  const testResult = await updateTestResult(id, updateData);

  // Update vaccinations in test_result_vaccinations table if provided
  if (data.vaccinations !== undefined) {
    // Delete all existing vaccinations
    await deleteTestResultVaccinationsByTestResultId(id);
    // Create new vaccinations
    if (data.vaccinations.length > 0) {
      for (const vaccination of data.vaccinations) {
        const vaccinationDate = vaccination.vaccinationDate ? new Date(vaccination.vaccinationDate) : null;
        await createTestResultVaccination({
          testResultId: id,
          vaccinationId: vaccination.vaccinationId,
          vaccineName: vaccination.vaccineName || null,
          batchNumber: vaccination.batchNumber || null,
          vaccinationDate: vaccinationDate,
        });
      }
    }
  }

  // Fetch joined data for response
  const testType = await findTestTypeById(testResult.testTypeId);
  const pathogen = testResult.pathogenId
    ? await findPathogenById(testResult.pathogenId)
    : null;

  // Load vaccinations for response
  const vaccinations = await findTestResultVaccinationsByTestResultId(id);
  const vaccinationResponses = await Promise.all(
    vaccinations.map(async (v) => {
      const vaccinationEntity = await findVaccinationById(v.vaccinationId);
      return {
        id: v.id,
        vaccinationId: v.vaccinationId,
        vaccinationName: vaccinationEntity?.name,
        vaccineName: v.vaccineName,
        batchNumber: v.batchNumber,
        vaccinationDate: v.vaccinationDate ? v.vaccinationDate.toISOString() : null,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      };
    }),
  );

  return {
    id: testResult.id,
    cityId: testResult.cityId,
    icpNumber: testResult.icpNumber,
    testTypeId: testResult.testTypeId,
    testTypeName: testType?.name,
    dateOfBirth: testResult.dateOfBirth,
    testDate: testResult.testDate,
    symptoms: testResult.symptoms,
    pathogenId: testResult.pathogenId,
    pathogenName: pathogen?.name || null,
    otherInformations: testResult.otherInformations,
    sari: testResult.sari,
    atb: testResult.atb,
    antivirals: testResult.antivirals,
    obesity: testResult.obesity,
    respiratorySupport: testResult.respiratorySupport,
    ecmo: testResult.ecmo,
    pregnancy: testResult.pregnancy,
    trimester: testResult.trimester,
    vaccinations: vaccinationResponses,
    patientId: testResult.patientId,
    patientIdentifier:
      updatedPatientIdentifier !== undefined
        ? updatedPatientIdentifier
        : testResult.patientIdentifier || null,
    createdBy: testResult.createdBy,
    createdAt: testResult.createdAt,
    updatedAt: testResult.updatedAt,
  };
};

/**
 * Delete a test result (doctor/user only)
 * @param id - Test result ID
 * @param userId - User ID of the deleter (for ownership verification)
 * @returns True if deleted successfully
 */
export const deleteTestResultService = async (
  id: string,
  userId: string,
): Promise<boolean> => {
  // Check if test result exists and user has permission
  const existing = await findTestResultById(id);
  if (!existing) {
    throw new NotFoundError('Test result not found');
  }

  // Verify ownership (doctors can only delete their own results)
  if (existing.createdBy !== userId) {
    throw new ForbiddenError('You do not have permission to delete this test result');
  }

  return await deleteTestResult(id);
};

/**
 * Delete a test result (admin only - bypasses ownership check)
 * @param id - Test result ID
 * @returns True if deleted successfully
 */
export const deleteTestResultAdminService = async (id: string): Promise<boolean> => {
  // Check if test result exists
  const existing = await findTestResultById(id);
  if (!existing) {
    throw new NotFoundError('Test result not found');
  }

  // Admins can delete any test result without ownership verification
  return await deleteTestResult(id);
};

/**
 * Get test results for export by date interval (doctor only)
 * @param doctorId - Doctor user ID
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Array of test result responses
 */
export const getDoctorTestResultsByInterval = async (
  doctorId: string,
  startDate?: string,
  endDate?: string,
  city?: string,
): Promise<TestResultResponse[]> => {
  // Validate dates if provided
  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new BadRequestError('Invalid start date format');
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      throw new BadRequestError('Invalid end date format');
    }
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      throw new BadRequestError('Start date must be before end date');
    }
  }

  return await findDoctorTestResultsByInterval(doctorId, startDate, endDate, city);
};

/**
 * Get test results for export by patient (doctor only)
 * @param doctorId - Doctor user ID
 * @param patientId - Patient ID
 * @returns Array of test result responses
 */
export const getDoctorTestResultsByPatient = async (
  doctorId: string,
  patientId: string,
): Promise<TestResultResponse[]> => {
  // Verify patient belongs to doctor
  const patient = await findPatientById(patientId);
  if (!patient) {
    throw new NotFoundError('Patient not found');
  }

  if (patient.doctorId !== doctorId) {
    throw new ForbiddenError('You do not have permission to access this patient');
  }

  return await findDoctorTestResultsByPatient(doctorId, patientId);
};

/**
 * Get test results for admin with filters and pagination
 * @param options - Filter and pagination options
 * @returns Object with results array and total count
 */
export const getAdminTestResults = async (options: {
  city?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<{ results: TestResultResponse[]; total: number }> => {
  // Validate pagination
  if (options.limit !== undefined && (options.limit < 1 || options.limit > 100)) {
    throw new BadRequestError('Limit must be between 1 and 100');
  }

  if (options.offset !== undefined && options.offset < 0) {
    throw new BadRequestError('Offset must be non-negative');
  }

  // Validate dates if provided
  if (options.startDate) {
    const start = new Date(options.startDate);
    if (isNaN(start.getTime())) {
      throw new BadRequestError('Invalid start date format');
    }
  }

  if (options.endDate) {
    const end = new Date(options.endDate);
    if (isNaN(end.getTime())) {
      throw new BadRequestError('Invalid end date format');
    }
  }

  if (options.startDate && options.endDate) {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);
    if (start > end) {
      throw new BadRequestError('Start date must be before end date');
    }
  }

  return await findAdminTestResults(options);
};

/**
 * Get test results for admin export with filters
 * @param options - Filter options (city, doctorId, startDate, endDate)
 * @returns Array of test result responses
 */
export const getAdminTestResultsForExport = async (options: {
  city?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<TestResultResponse[]> => {
  // Validate dates if provided
  if (options.startDate) {
    const start = new Date(options.startDate);
    if (isNaN(start.getTime())) {
      throw new BadRequestError('Invalid start date format');
    }
  }

  if (options.endDate) {
    const end = new Date(options.endDate);
    if (isNaN(end.getTime())) {
      throw new BadRequestError('Invalid end date format');
    }
  }

  if (options.startDate && options.endDate) {
    const start = new Date(options.startDate);
    const end = new Date(options.endDate);
    if (start > end) {
      throw new BadRequestError('Start date must be before end date');
    }
  }

  return await findAdminTestResultsForExport(options);
};

