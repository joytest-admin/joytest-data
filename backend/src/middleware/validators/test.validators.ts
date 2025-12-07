/**
 * Request validation rules for test-related endpoints
 */

import { body, query } from 'express-validator';

/**
 * Validation rules for creating a test type
 */
export const createTestTypeValidator = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
];

/**
 * Validation rules for updating a test type
 */
export const updateTestTypeValidator = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
];

/**
 * Validation rules for creating a vaccination
 */
export const createVaccinationValidator = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
];

/**
 * Validation rules for updating a vaccination
 */
export const updateVaccinationValidator = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
];

/**
 * Validation rules for creating a test result
 */
export const createTestResultValidator = [
  body('cityId')
    .notEmpty()
    .withMessage('City part ID is required')
    .isInt({ min: 1 })
    .withMessage('City part ID must be a valid integer'),
  body('icpNumber')
    .notEmpty()
    .withMessage('ICP number is required')
    .trim(),
  body('testTypeId')
    .notEmpty()
    .withMessage('Test type ID is required')
    .isUUID()
    .withMessage('Test type ID must be a valid UUID'),
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Date of birth must be a valid ISO 8601 date'),
  body('symptoms')
    .optional()
    .isArray()
    .withMessage('Symptoms must be an array')
    .custom((value) => {
      if (value !== undefined && value !== null) {
        if (!Array.isArray(value)) {
          throw new Error('Symptoms must be an array');
        }
        if (!value.every((item) => typeof item === 'string' && item.trim().length > 0)) {
          throw new Error('All symptoms must be non-empty strings');
        }
      }
      return true;
    }),
  body('otherInformations')
    .optional()
    .isString()
    .withMessage('Other informations must be a string'),
  body('sari')
    .optional()
    .isBoolean()
    .withMessage('SARI must be a boolean'),
  body('atb')
    .optional()
    .isBoolean()
    .withMessage('ATB must be a boolean'),
  body('antivirals')
    .optional()
    .isBoolean()
    .withMessage('Antivirals must be a boolean'),
  body('obesity')
    .optional()
    .isBoolean()
    .withMessage('Obesity must be a boolean'),
  body('respiratorySupport')
    .optional()
    .isBoolean()
    .withMessage('Respiratory support must be a boolean'),
  body('ecmo')
    .optional()
    .isBoolean()
    .withMessage('ECMO must be a boolean'),
  body('pregnancy')
    .optional()
    .isBoolean()
    .withMessage('Pregnancy must be a boolean'),
  body('trimester')
    .optional({ nullable: true })
    .custom((value) => {
      if (value !== undefined && value !== null) {
        if (!Number.isInteger(value) || value < 1 || value > 3) {
          throw new Error('Trimester must be 1, 2, or 3');
        }
      }
      return true;
    })
    .custom((value, { req }) => {
      // If trimester is provided (not null), pregnancy must be true
      if (value !== undefined && value !== null && req.body.pregnancy === false) {
        throw new Error('Trimester cannot be set when pregnancy is false');
      }
      return true;
    }),
  body('vaccinations')
    .optional()
    .isArray()
    .withMessage('Vaccinations must be an array')
    .custom((value) => {
      if (value !== undefined && value !== null) {
        if (!Array.isArray(value)) {
          throw new Error('Vaccinations must be an array');
        }
        for (const vaccination of value) {
          if (!vaccination.vaccinationId) {
            throw new Error('Each vaccination must have a vaccinationId');
          }
          if (typeof vaccination.vaccinationId !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(vaccination.vaccinationId)) {
            throw new Error('Each vaccination must have a valid UUID vaccinationId');
          }
          if (vaccination.vaccineName !== undefined && (typeof vaccination.vaccineName !== 'string' || vaccination.vaccineName.length > 255)) {
            throw new Error('Vaccine name must be a string with max 255 characters');
          }
          if (vaccination.batchNumber !== undefined && (typeof vaccination.batchNumber !== 'string' || vaccination.batchNumber.length > 255)) {
            throw new Error('Batch number must be a string with max 255 characters');
          }
          if (vaccination.vaccinationDate !== undefined && vaccination.vaccinationDate !== null) {
            if (typeof vaccination.vaccinationDate !== 'string') {
              throw new Error('Vaccination date must be a string');
            }
            // Validate ISO 8601 date format
            const date = new Date(vaccination.vaccinationDate);
            if (isNaN(date.getTime())) {
              throw new Error('Vaccination date must be a valid ISO 8601 date');
            }
          }
        }
      }
      return true;
    }),
  body('patientId')
    .optional()
    .isUUID()
    .withMessage('Patient ID must be a valid UUID'),
];

/**
 * Validation rules for creating a common symptom
 */
export const createCommonSymptomValidator = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
];

/**
 * Validation rules for updating a common symptom
 */
export const updateCommonSymptomValidator = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
];

/**
 * Validation rules for updating a test result
 */
export const updateTestResultValidator = [
  body('cityId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('City part ID must be a valid integer'),
  body('icpNumber')
    .optional()
    .notEmpty()
    .withMessage('ICP number cannot be empty')
    .trim(),
  body('testTypeId')
    .optional()
    .isUUID()
    .withMessage('Test type ID must be a valid UUID'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid ISO 8601 date'),
  body('symptoms')
    .optional()
    .isArray()
    .withMessage('Symptoms must be an array')
    .custom((value) => {
      if (value !== undefined && value !== null) {
        if (!Array.isArray(value)) {
          throw new Error('Symptoms must be an array');
        }
        if (!value.every((item) => typeof item === 'string' && item.trim().length > 0)) {
          throw new Error('All symptoms must be non-empty strings');
        }
      }
      return true;
    }),
  body('otherInformations')
    .optional()
    .isString()
    .withMessage('Other informations must be a string'),
  body('sari')
    .optional()
    .isBoolean()
    .withMessage('SARI must be a boolean'),
  body('atb')
    .optional()
    .isBoolean()
    .withMessage('ATB must be a boolean'),
  body('antivirals')
    .optional()
    .isBoolean()
    .withMessage('Antivirals must be a boolean'),
  body('obesity')
    .optional()
    .isBoolean()
    .withMessage('Obesity must be a boolean'),
  body('respiratorySupport')
    .optional()
    .isBoolean()
    .withMessage('Respiratory support must be a boolean'),
  body('ecmo')
    .optional()
    .isBoolean()
    .withMessage('ECMO must be a boolean'),
  body('pregnancy')
    .optional()
    .isBoolean()
    .withMessage('Pregnancy must be a boolean'),
  body('trimester')
    .optional({ nullable: true })
    .custom((value) => {
      if (value !== undefined && value !== null) {
        if (!Number.isInteger(value) || value < 1 || value > 3) {
          throw new Error('Trimester must be 1, 2, or 3');
        }
      }
      return true;
    })
    .custom((value, { req }) => {
      // If trimester is provided (not null), pregnancy must be true
      if (value !== undefined && value !== null && req.body.pregnancy === false) {
        throw new Error('Trimester cannot be set when pregnancy is false');
      }
      return true;
    }),
  body('vaccinations')
    .optional()
    .isArray()
    .withMessage('Vaccinations must be an array')
    .custom((value) => {
      if (value !== undefined && value !== null) {
        if (!Array.isArray(value)) {
          throw new Error('Vaccinations must be an array');
        }
        for (const vaccination of value) {
          if (!vaccination.vaccinationId) {
            throw new Error('Each vaccination must have a vaccinationId');
          }
          if (typeof vaccination.vaccinationId !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(vaccination.vaccinationId)) {
            throw new Error('Each vaccination must have a valid UUID vaccinationId');
          }
          if (vaccination.vaccineName !== undefined && (typeof vaccination.vaccineName !== 'string' || vaccination.vaccineName.length > 255)) {
            throw new Error('Vaccine name must be a string with max 255 characters');
          }
          if (vaccination.batchNumber !== undefined && (typeof vaccination.batchNumber !== 'string' || vaccination.batchNumber.length > 255)) {
            throw new Error('Batch number must be a string with max 255 characters');
          }
          if (vaccination.vaccinationDate !== undefined && vaccination.vaccinationDate !== null) {
            if (typeof vaccination.vaccinationDate !== 'string') {
              throw new Error('Vaccination date must be a string');
            }
            // Validate ISO 8601 date format
            const date = new Date(vaccination.vaccinationDate);
            if (isNaN(date.getTime())) {
              throw new Error('Vaccination date must be a valid ISO 8601 date');
            }
          }
        }
      }
      return true;
    }),
  body('patientId')
    .optional({ nullable: true })
    .custom((value) => value === null || /^[0-9a-fA-F-]{36}$/.test(value))
    .withMessage('Patient ID must be a valid UUID or null'),
];

/**
 * Validation rules for getting doctor test results with search, sorting, and pagination
 */
export const getDoctorTestResultsValidator = [
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search query must be at most 255 characters'),
  query('city')
    .optional()
    .isString()
    .withMessage('City must be a string')
    .trim()
    .isLength({ max: 255 })
    .withMessage('City must be at most 255 characters'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('sortBy')
    .optional()
    .isIn(['created_at', 'date_of_birth', 'city', 'test_type_name', 'pathogen_name', 'patient_identifier'])
    .withMessage('sortBy must be one of: created_at, date_of_birth, city, test_type_name, pathogen_name, patient_identifier'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either "asc" or "desc"'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .toInt(),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
    .toInt(),
];

