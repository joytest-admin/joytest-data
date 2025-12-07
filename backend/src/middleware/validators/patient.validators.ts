import { body, query } from 'express-validator';

export const createPatientAdminValidator = [
  body('doctorId')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isUUID()
    .withMessage('Doctor ID must be a valid UUID'),
  body('identifier')
    .notEmpty()
    .withMessage('Identifier is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Identifier must be at most 255 characters long'),
  body('note')
    .optional()
    .isString()
    .withMessage('Note must be a string'),
  body('yearOfBirth')
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Year of birth must be a valid year between 1900 and 2100'),
];

export const createDoctorPatientValidator = [
  body('identifier')
    .notEmpty()
    .withMessage('Identifier is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Identifier must be at most 255 characters long'),
  body('note')
    .optional()
    .isString()
    .withMessage('Note must be a string'),
  body('yearOfBirth')
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Year of birth must be a valid year between 1900 and 2100'),
];

export const updatePatientValidator = [
  body('identifier')
    .optional()
    .notEmpty()
    .withMessage('Identifier cannot be empty')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Identifier must be at most 255 characters long'),
  body('note')
    .optional()
    .isString()
    .withMessage('Note must be a string'),
  body('yearOfBirth')
    .optional()
    .custom((value) => {
      if (value === null) return true;
      if (typeof value === 'number' && Number.isInteger(value) && value >= 1900 && value <= 2100) {
        return true;
      }
      throw new Error('Year of birth must be a valid year between 1900 and 2100 or null');
    }),
];

export const searchPatientsValidator = [
  query('q')
    .notEmpty()
    .withMessage('Search query (q) is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Search query must be between 1 and 255 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

