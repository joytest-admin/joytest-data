/**
 * Validation middleware
 * Uses express-validator to validate request data
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { BadRequestError } from '../utils/errors';

/**
 * Middleware to check validation results
 * Throws BadRequestError if validation fails
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    throw new BadRequestError(errorMessages.join(', '));
  }
  next();
};

/**
 * Helper to run validation chains
 * @param validations - Array of validation chains
 * @returns Array of middleware functions
 */
export const validateRequest = (validations: ValidationChain[]) => {
  return [...validations, validate];
};

