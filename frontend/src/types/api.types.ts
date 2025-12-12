/**
 * API response types
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
  };
}

/**
 * Auth types
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface IdentifyRequest {
  icpNumber: string;
}

export interface IdentifyByTokenRequest {
  token: string;
}

export interface PreregisterRequest {
  email?: string; // required if requirePassword is true
  icpNumber: string;
  cityId: number; // City part ID (required)
  requirePassword: boolean;
  password?: string;
}

export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface PreregisterResponse {
  id: string;
  email: string | null;
  role: string;
  icpNumber: string;
  requirePassword: boolean;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorProfileResponse {
  id: string;
  email: string | null;
  role: string;
  icpNumber: string;
  cityId?: number | null;
  requirePassword: boolean;
  uniqueLinkToken?: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDoctorProfileRequest {
  email?: string;
  cityId?: number;
  requirePassword?: boolean;
  password?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    icpNumber?: string | null;
    requirePassword?: boolean;
    status?: UserStatus;
  };
}

export interface IdentifyResponse {
  id: string;
  email: string;
  role: string;
  icpNumber: string | null;
  city: string | null;
  requirePassword: boolean;
  status?: UserStatus;
}

/**
 * Test type types
 */
export interface TestType {
  id: string;
  name: string;
  pathogenIds?: string[]; // Array of associated pathogen IDs
  createdAt: string;
  updatedAt: string;
}

/**
 * Pathogen types
 */
export interface Pathogen {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vaccination types
 */
export interface Vaccination {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Test result vaccination types
 */
export interface TestResultVaccinationRequest {
  vaccinationId: string;
  vaccineName?: string; // Název vakcíny
  batchNumber?: string; // Šarže vakcíny
  vaccinationDate?: string; // ISO date string - Datum vakcinace
}

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

/**
 * Common symptom types
 */
export interface CommonSymptom {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Test result types
 */
export interface CreateTestResultRequest {
  cityId: number;
  icpNumber: string; // ICP number from doctor's profile
  testTypeId: string;
  dateOfBirth: string; // ISO date string
  testDate: string; // ISO date string - Date when the test was actually performed
  symptoms?: string[]; // Optional - can be empty array or undefined
  pathogenId?: string; // Required if result is positive
  patientId?: string;
  token?: string; // Unique link token (for passwordless authentication)
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

export interface UpdateTestResultRequest {
  cityId?: number;
  testTypeId?: string;
  dateOfBirth?: string; // ISO date string
  testDate?: string; // ISO date string - Date when the test was actually performed
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

export interface TestResultResponse {
  id: string;
  cityId: number;
  cityName?: string | null;
  icpNumber: string;
  testTypeId: string;
  testTypeName?: string;
  dateOfBirth: string;
  testDate: string; // Date when the test was actually performed
  symptoms: string[];
  pathogenId?: string | null;
  pathogenName?: string | null;
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
  createdAt: string;
  updatedAt: string;
}

/**
 * Patient types
 */
export interface Patient {
  id: string;
  doctorId: string;
  identifier: string;
  note: string | null;
  yearOfBirth: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientRequest {
  identifier: string;
  note?: string;
  yearOfBirth?: number | null;
}

export interface UpdatePatientRequest {
  identifier?: string;
  note?: string | null;
  yearOfBirth?: number | null;
}

/**
 * Feedback types
 */
export type FeedbackCategory = 'bug' | 'feature_request' | 'question' | 'other';
export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface CreateFeedbackRequest {
  category: FeedbackCategory;
  subject: string;
  message: string;
  contextUrl?: string | null;
}

export interface UpdateFeedbackRequest {
  status?: FeedbackStatus;
  adminResponse?: string | null;
}

export interface FeedbackResponse {
  id: string;
  doctorId: string;
  doctorEmail: string | null;
  doctorIcpNumber: string | null;
  category: FeedbackCategory;
  subject: string;
  message: string;
  status: FeedbackStatus;
  adminId: string | null;
  adminEmail: string | null;
  adminResponse: string | null;
  contextUrl: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

/**
 * Geography types
 */
export interface RegionResponse {
  id: number;
  name: string;
  createdAt: string;
}

export interface DistrictResponse {
  id: number;
  name: string;
  regionId: number;
  region?: RegionResponse;
  createdAt: string;
}

export interface CityResponse {
  id: number;
  name: string;
  districtId: number;
  district?: DistrictResponse;
  createdAt: string;
}


/**
 * Statistics types
 */
export interface PathogensByAgeGroupsStats {
  pathogenName: string;
  ageGroup: string;
  count: number;
}

