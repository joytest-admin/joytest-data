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
 * Test type types
 */
export interface TestType {
  id: string;
  name: string;
  pathogenIds?: string[]; // Array of associated pathogen IDs
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestTypeRequest {
  name: string;
  pathogenIds?: string[];
}

export interface UpdateTestTypeRequest {
  name?: string;
  pathogenIds?: string[];
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

export interface CreateVaccinationRequest {
  name: string;
}

export interface UpdateVaccinationRequest {
  name?: string;
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

export interface Pathogen {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommonSymptomRequest {
  name: string;
}

export interface UpdateCommonSymptomRequest {
  name?: string;
}

/**
 * Auth types
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    city?: string | null;
  };
}

/**
 * User/Doctor types
 */
export interface User {
  id: string;
  email: string;
  role: string;
  icpNumber: string | null;
  cityId: number | null; // City ID
  cityName?: string | null; // City name (populated when joining with cities)
  uniqueLinkToken?: string | null; // Unique link token for passwordless authentication
  requirePassword: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email?: string; // required if requirePassword is true
  icpNumber: string;
  cityId: number; // City ID (required)
  requirePassword?: boolean;
  password?: string; // required if requirePassword is true
}

export interface UpdateUserRequest {
  email?: string; // required if requirePassword is true
  icpNumber?: string;
  cityId?: number;
  requirePassword?: boolean;
  password?: string;
}

export interface PreregisterRequest {
  email?: string; // required if requirePassword is true
  icpNumber: string;
  city: string;
  requirePassword: boolean;
  password?: string;
}

export interface ValidateUserRequest {
  status: 'approved' | 'rejected';
}

/**
 * Feedback types
 */
export type FeedbackCategory = 'bug' | 'feature_request' | 'question' | 'other';
export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

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
 * Test result types
 */
export interface TestResultResponse {
  id: string;
  city: string;
  icpNumber: string;
  testTypeId: string;
  testTypeName?: string;
  dateOfBirth: string;
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
  vaccinationId: string | null;
  vaccinationName?: string | null;
  patientId?: string | null;
  patientIdentifier?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Translation types
 */
export type TranslationEntityType = 'test_type' | 'vaccination' | 'common_symptom' | 'pathogen';

export interface Translation {
  id: string;
  entityType: TranslationEntityType;
  entityId: string;
  languageCode: string;
  translation: string;
  entityName?: string; // Name of the original entity (for admin UI)
  createdAt: string;
  updatedAt: string;
}

export interface CreateTranslationRequest {
  entityType: TranslationEntityType;
  entityId: string;
  languageCode: string;
  translation: string;
}

export interface UpdateTranslationRequest {
  translation: string;
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


