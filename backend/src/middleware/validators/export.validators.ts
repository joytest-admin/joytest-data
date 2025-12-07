/**
 * Export validators
 * Validates request data for export endpoints
 */

import { query } from 'express-validator';

/**
 * Validator for exporting test results by time interval
 * Dates are optional - if not provided, exports all results (with optional city filter)
 */
export const exportByIntervalValidator = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('city')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('City must be at most 255 characters'),
];

/**
 * Validator for exporting test results by patient
 */
export const exportByPatientValidator = [
  query('patientId')
    .notEmpty()
    .withMessage('Patient ID is required')
    .isUUID()
    .withMessage('Patient ID must be a valid UUID'),
];

/**
 * Validator for admin export with filters
 */
export const adminExportValidator = [
  query('city')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('City must be at most 255 characters'),
  query('doctorId')
    .optional()
    .isUUID()
    .withMessage('Doctor ID must be a valid UUID'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
];

