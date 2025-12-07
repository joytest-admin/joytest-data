/**
 * Feedback validators
 * Validates request data for feedback endpoints
 */

import { body, query } from 'express-validator';
import { FeedbackCategory, FeedbackStatus } from '../../types/feedback.types';

/**
 * Validator for creating feedback (doctor)
 */
export const createFeedbackValidator = [
  body('category')
    .isIn(Object.values(FeedbackCategory))
    .withMessage('Category must be one of: bug, feature_request, question, other'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Subject must be between 1 and 255 characters'),
  body('message')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Message is required and cannot be empty'),
  body('contextUrl')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      // If value is null, undefined, or empty string, it's valid (optional field)
      if (!value || value === null || value === '') {
        return true;
      }
      // If value exists, it must be a valid URL
      const urlPattern = /^https?:\/\/.+/;
      if (typeof value === 'string' && value.length <= 500) {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    })
    .withMessage('Context URL must be a valid URL (max 500 characters) or empty'),
];

/**
 * Validator for updating feedback (admin)
 */
export const updateFeedbackValidator = [
  body('status')
    .optional()
    .isIn(Object.values(FeedbackStatus))
    .withMessage('Status must be one of: new, in_progress, resolved, closed'),
  body('adminResponse')
    .optional()
    .isString()
    .trim()
    .withMessage('Admin response must be a string'),
];

/**
 * Validator for querying feedback (admin)
 */
export const getFeedbackValidator = [
  query('status')
    .optional()
    .isIn(Object.values(FeedbackStatus))
    .withMessage('Status must be one of: new, in_progress, resolved, closed'),
  query('category')
    .optional()
    .isIn(Object.values(FeedbackCategory))
    .withMessage('Category must be one of: bug, feature_request, question, other'),
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

/**
 * Validator for querying doctor's own feedback
 */
export const getDoctorFeedbackValidator = [
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

