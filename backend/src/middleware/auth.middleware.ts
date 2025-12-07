/**
 * Authentication middleware
 * Handles JWT token verification and user authentication
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, JWTPayload, UserRole } from '../types/auth.types';
import { extractTokenFromHeader, verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { findUserByUniqueLinkToken } from '../queries/user.queries';
import { UserStatus } from '../types/auth.types';

/**
 * Middleware to authenticate requests using JWT bearer token
 * Adds user information to request object if token is valid
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  // Attach user information to request
  (req as AuthenticatedRequest).user = payload;
  next();
};

/**
 * Middleware to ensure user is an admin
 * Must be used after authenticate middleware
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (authReq.user.role !== 'admin') {
    throw new UnauthorizedError('Admin access required');
  }

  next();
};

/**
 * Middleware to ensure user is a doctor (regular user)
 * Must be used after authenticate middleware
 */
export const requireDoctor = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    throw new UnauthorizedError('Authentication required');
  }

  // Check role - UserRole.USER enum value equals 'user'
  if (authReq.user.role !== UserRole.USER) {
    throw new UnauthorizedError('Doctor access required');
  }

  next();
};

/**
 * Middleware to authenticate requests using either JWT bearer token or unique link token
 * Supports both authentication methods for doctor endpoints
 */
export const authenticateDoctor = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Try JWT token first
  const jwtToken = extractTokenFromHeader(req.headers.authorization);
  if (jwtToken) {
    const payload = verifyToken(jwtToken);
    if (payload) {
      (req as AuthenticatedRequest).user = payload;
      return next();
    }
  }

  // Try link token from header or query parameter
  // Express normalizes headers to lowercase, so 'x-link-token' should work
  // But also check query parameter as fallback
  // Note: Express may store headers with lowercase keys, so we check the lowercase version
  const linkTokenHeader = 
    (req.headers['x-link-token'] as string | undefined) ||
    (req.headers['X-Link-Token'] as string | undefined);
  
  // Check query parameter - Express parses query strings automatically
  const linkTokenQuery = typeof req.query.token === 'string' ? req.query.token : undefined;
  const linkToken = linkTokenHeader || linkTokenQuery;

  if (linkToken) {
    try {
      const user = await findUserByUniqueLinkToken(linkToken);
      if (!user) {
        throw new UnauthorizedError('Uživatel s tímto tokenem nebyl nalezen');
      }

      if (user.status !== UserStatus.APPROVED) {
        throw new UnauthorizedError('Váš účet čeká na schválení nebo byl zamítnut');
      }

      if (user.requirePassword) {
        throw new UnauthorizedError('Tento uživatel vyžaduje přihlášení pomocí hesla');
      }

      // Create a mock JWT payload for consistency
      (req as AuthenticatedRequest).user = {
        userId: user.id,
        role: user.role,
        email: user.email,
      };
      return next();
    } catch (error: any) {
      throw new UnauthorizedError(error.message || 'Authentication failed');
    }
  }

  throw new UnauthorizedError('Authentication required: provide Bearer token or unique link token');
};

/**
 * Middleware to verify superadmin token from header
 * Used for superadmin-only operations (admin management)
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const superAdminToken = req.headers['x-superadmin-token'] as string;
  const expectedToken = process.env.SUPERADMIN_TOKEN;

  if (!expectedToken) {
    throw new Error('SUPERADMIN_TOKEN not configured');
  }

  if (!superAdminToken || superAdminToken !== expectedToken) {
    throw new UnauthorizedError('Superadmin token required');
  }

  next();
};
