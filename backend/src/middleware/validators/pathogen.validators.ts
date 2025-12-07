/**
 * Validation rules for pathogen endpoints
 */

import { body } from 'express-validator';

/**
 * Validation rules for creating a pathogen
 */
export const createPathogenValidator = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
];

/**
 * Validation rules for updating a pathogen
 */
export const updatePathogenValidator = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
];

