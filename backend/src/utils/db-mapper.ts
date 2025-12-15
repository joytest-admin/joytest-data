/**
 * Database column name mapper
 * Maps snake_case database columns to camelCase TypeScript properties
 */

import { UserEntity } from '../types/auth.types';
import { PatientEntity } from '../types/patient.types';
import { TestTypeEntity, VaccinationEntity, TestResultEntity, CommonSymptomEntity } from '../types/test.types';
import { FeedbackEntity } from '../types/feedback.types';
import { TranslationEntity } from '../types/translation.types';

/**
 * Map database row to UserEntity
 * Converts snake_case columns to camelCase properties
 * @param row - Database row with snake_case columns
 * @returns UserEntity with camelCase properties
 */
export const mapUserRow = (row: any): UserEntity => {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    passwordHash: row.password_hash,
    icpNumber: row.icp_number,
    cityId: row.city_id || null,
    uniqueLinkToken: row.unique_link_token || null,
    requirePassword: row.require_password,
    status: row.status || 'approved', // Default to 'approved' for backward compatibility
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapPatientRow = (row: any): PatientEntity => {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    identifier: row.identifier,
    note: row.note,
    yearOfBirth: row.year_of_birth || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Map database row to TestTypeEntity
 * @param row - Database row with snake_case columns
 * @returns TestTypeEntity with camelCase properties
 */
export const mapTestTypeRow = (row: any): TestTypeEntity => {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Map database row to VaccinationEntity
 * @param row - Database row with snake_case columns
 * @returns VaccinationEntity with camelCase properties
 */
export const mapVaccinationRow = (row: any): VaccinationEntity => {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Map database row to TestResultEntity
 * @param row - Database row with snake_case columns
 * @returns TestResultEntity with camelCase properties
 */
export const mapTestResultRow = (row: any): TestResultEntity => {
  return {
    id: row.id,
    cityId: row.city_id,
    icpNumber: row.icp_number,
    testTypeId: row.test_type_id,
    dateOfBirth: row.date_of_birth,
    testDate: row.test_date,
    symptoms: row.symptoms || [],
    pathogenId: row.pathogen_id || null,
    otherInformations: row.other_informations,
    sari: row.sari,
    atb: row.atb,
    antivirals: row.antivirals,
    obesity: row.obesity,
    respiratorySupport: row.respiratory_support,
    ecmo: row.ecmo,
    pregnancy: row.pregnancy,
    trimester: row.trimester || null,
    patientId: row.patient_id || null,
    patientIdentifier: typeof row.patient_identifier === 'string' ? row.patient_identifier : null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Map database row to CommonSymptomEntity
 * @param row - Database row with snake_case columns
 * @returns CommonSymptomEntity with camelCase properties
 */
export const mapCommonSymptomRow = (row: any): CommonSymptomEntity => {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Map database row to FeedbackEntity
 * @param row - Database row with snake_case columns
 * @returns FeedbackEntity with camelCase properties
 */
export const mapFeedbackRow = (row: any): FeedbackEntity => {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    category: row.category,
    subject: row.subject,
    message: row.message,
    status: row.status,
    adminId: row.admin_id || null,
    adminResponse: row.admin_response || null,
    contextUrl: row.context_url || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at || null,
  };
};

/**
 * Map database row to TranslationEntity
 * @param row - Database row with snake_case columns
 * @returns TranslationEntity with camelCase properties
 */
export const mapTranslationRow = (row: any): TranslationEntity => {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    languageCode: row.language_code,
    translation: row.translation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};
