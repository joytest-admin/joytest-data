/**
 * Password hashing and verification utilities
 */

import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns True if password matches hash, false otherwise
 */
export const verifyPassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

