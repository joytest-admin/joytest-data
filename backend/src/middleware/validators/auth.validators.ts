/**
 * Request validation rules for authentication endpoints
 */

import { body } from 'express-validator';

/**
 * Validation rules for creating an admin
 */
export const createAdminValidator = [
  body('email')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];

/**
 * Validation rules for updating an admin
 */
export const updateAdminValidator = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];

/**
 * Validation rules for creating a user
 */
export const createUserValidator = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail()
    .custom((value, { req }) => {
      // Email is required if requirePassword is true
      if (req.body.requirePassword === true && !value) {
        throw new Error('Email is required when requirePassword is set to true');
      }
      return true;
    }),
  body('icpNumber')
    .notEmpty()
    .withMessage('ICP number is required')
    .trim(),
  body('cityId')
    .notEmpty()
    .withMessage('City part ID is required')
    .isInt({ min: 1 })
    .withMessage('City part ID must be a positive integer'),
  body('requirePassword')
    .optional()
    .isBoolean()
    .withMessage('requirePassword must be a boolean'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom((value, { req }) => {
      // If requirePassword is true, password must be provided
      if (req.body.requirePassword === true && !value) {
        throw new Error('Password is required when requirePassword is true');
      }
      return true;
    }),
];

/**
 * Validation rules for updating a user
 */
export const updateUserValidator = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),
  body('icpNumber')
    .optional()
    .notEmpty()
    .withMessage('ICP number cannot be empty')
    .trim(),
  body('cityId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('City part ID must be a positive integer'),
  body('requirePassword')
    .optional()
    .isBoolean()
    .withMessage('requirePassword must be a boolean'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom((value, { req }) => {
      // If requirePassword is set to true, password must be provided
      if (req.body.requirePassword === true && !value) {
        throw new Error('Password is required when requirePassword is set to true');
      }
      return true;
    }),
];

/**
 * Validation rules for setting up user password
 */
export const setupUserPasswordValidator = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];

/**
 * Validation rules for login
 */
export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Validation rules for identifying by ICP
 */
export const identifyByIcpValidator = [
  body('icpNumber')
    .notEmpty()
    .withMessage('ICP number is required')
    .trim(),
];

/**
 * Validation rules for identifying by unique link token
 */
export const identifyByTokenValidator = [
  body('token')
    .notEmpty()
    .withMessage('Token is required')
    .isUUID()
    .withMessage('Token must be a valid UUID')
    .trim(),
];

/**
 * Validation rules for preregistration (public endpoint)
 */
export const preregisterValidator = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail()
    .custom((value, { req }) => {
      // Email is required if requirePassword is true
      if (req.body.requirePassword === true && !value) {
        throw new Error('Email is required when requirePassword is set to true');
      }
      return true;
    }),
  body('icpNumber')
    .notEmpty()
    .withMessage('ICP number is required')
    .trim(),
  body('cityId')
    .notEmpty()
    .withMessage('City part ID is required')
    .isInt({ min: 1 })
    .withMessage('City part ID must be a positive integer'),
  body('requirePassword')
    .notEmpty()
    .withMessage('requirePassword is required')
    .isBoolean()
    .withMessage('requirePassword must be a boolean'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .custom((value, { req }) => {
      // If requirePassword is true, password must be provided
      if (req.body.requirePassword === true && !value) {
        throw new Error('Password is required when requirePassword is true');
      }
      return true;
    }),
];

/**
 * Validation rules for validating (approving/rejecting) a user
 */
export const validateUserValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either "approved" or "rejected"'),
];

/**
 * Validation rules for doctor profile update (self-service)
 */
export const updateDoctorProfileValidator = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),
  body('requirePassword')
    .optional()
    .isBoolean()
    .withMessage('requirePassword must be a boolean'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('cityId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('City part ID must be a positive integer'),
];

