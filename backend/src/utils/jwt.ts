/**
 * JWT token generation and verification utilities
 */

import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT token for a user
 * @param payload - JWT payload containing user information
 * @returns JWT token string
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

/**
 * Verify and decode a JWT token
 * @param token - JWT token string to verify
 * @returns Decoded JWT payload if valid, null otherwise
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns Token string if valid format, null otherwise
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

