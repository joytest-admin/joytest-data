/**
 * Test-related type definitions
 */

/**
 * Test type entity (stored in database)
 */
export interface TestTypeEntity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vaccination entity (stored in database)
 */
export interface VaccinationEntity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Common symptom entity (stored in database)
 */
export interface CommonSymptomEntity {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Test result entity (stored in database)
 */
export interface TestResultEntity {
  id: string;
  cityId: number;
  icpNumber: string;
  testTypeId: string;
  dateOfBirth: Date;
  symptoms: string[];
  pathogenId: string | null;
  otherInformations: string | null;
  sari: boolean | null;
  atb: boolean | null;
  antivirals: boolean | null;
  obesity: boolean | null;
  respiratorySupport: boolean | null;
  ecmo: boolean | null;
  pregnancy: boolean | null;
  trimester: number | null; // 1, 2, or 3 (only when pregnancy is true)
  patientId: string | null;
  patientIdentifier?: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create test type request (admin only)
 */
export interface CreateTestTypeRequest {
  name: string;
  pathogenIds?: string[]; // Array of pathogen IDs to associate with this test type
}

/**
 * Update test type request (admin only)
 */
export interface UpdateTestTypeRequest {
  name?: string;
  pathogenIds?: string[]; // Array of pathogen IDs to associate with this test type
}

/**
 * Create vaccination request (admin only)
 */
export interface CreateVaccinationRequest {
  name: string;
}

/**
 * Update vaccination request (admin only)
 */
export interface UpdateVaccinationRequest {
  name?: string;
}

/**
 * Create common symptom request (admin only)
 */
export interface CreateCommonSymptomRequest {
  name: string;
}

/**
 * Update common symptom request (admin only)
 */
export interface UpdateCommonSymptomRequest {
  name?: string;
}

/**
 * Create test result request (doctor/user only)
 */
export interface CreateTestResultRequest {
  cityId: number;
  icpNumber: string;
  testTypeId: string;
  dateOfBirth: string; // ISO date string
  symptoms?: string[]; // Optional - can be empty array or undefined
  pathogenId?: string; // Required if result is positive
  patientId?: string;
  otherInformations?: string;
  sari?: boolean;
  atb?: boolean;
  antivirals?: boolean;
  obesity?: boolean;
  respiratorySupport?: boolean;
  ecmo?: boolean;
  pregnancy?: boolean;
  trimester?: number; // 1, 2, or 3 (only when pregnancy is true)
  vaccinations?: TestResultVaccinationRequest[]; // Array of vaccinations
}

/**
 * Update test result request (doctor/user only)
 */
export interface UpdateTestResultRequest {
  cityId?: number;
  icpNumber?: string;
  testTypeId?: string;
  dateOfBirth?: string; // ISO date string
  symptoms?: string[];
  pathogenId?: string;
  patientId?: string | null;
  otherInformations?: string;
  sari?: boolean;
  atb?: boolean;
  antivirals?: boolean;
  obesity?: boolean;
  respiratorySupport?: boolean;
  ecmo?: boolean;
  pregnancy?: boolean;
  trimester?: number; // 1, 2, or 3 (only when pregnancy is true)
  vaccinations?: TestResultVaccinationRequest[]; // Array of vaccinations
}

/**
 * Test result vaccination entity (stored in database)
 */
export interface TestResultVaccinationEntity {
  id: string;
  testResultId: string;
  vaccinationId: string;
  vaccineName: string | null;
  batchNumber: string | null;
  vaccinationDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Test result vaccination request (for create/update)
 */
export interface TestResultVaccinationRequest {
  vaccinationId: string;
  vaccineName?: string; // Název vakcíny
  batchNumber?: string; // Šarže vakcíny
  vaccinationDate?: string; // ISO date string - Datum vakcinace
}

/**
 * Response types
 */
export interface TestTypeResponse {
  id: string;
  name: string;
  pathogenIds?: string[]; // Array of associated pathogen IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface VaccinationResponse {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Test result vaccination response (for API)
 */
export interface TestResultVaccinationResponse {
  id: string;
  vaccinationId: string;
  vaccinationName?: string; // Populated from vaccinations table
  vaccineName: string | null;
  batchNumber: string | null;
  vaccinationDate: string | null; // ISO date string
  createdAt: string;
  updatedAt: string;
}

export interface CommonSymptomResponse {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestResultResponse {
  id: string;
  cityId: number;
  cityName?: string | null; // Populated when joining with cities
  icpNumber: string;
  testTypeId: string;
  testTypeName?: string; // Populated when joining with test_types
  dateOfBirth: Date;
  symptoms: string[];
  pathogenId: string | null;
  pathogenName?: string | null; // Populated when joining with pathogens
  otherInformations: string | null;
  sari: boolean | null;
  atb: boolean | null;
  antivirals: boolean | null;
  obesity: boolean | null;
  respiratorySupport: boolean | null;
  ecmo: boolean | null;
  pregnancy: boolean | null;
  trimester: number | null; // 1, 2, or 3 (only when pregnancy is true)
  vaccinations?: TestResultVaccinationResponse[]; // Array of vaccinations
  patientId?: string | null;
  patientIdentifier?: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

