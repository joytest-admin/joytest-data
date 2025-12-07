/**
 * User database queries
 * Handles all database operations for users (both admins and regular users)
 */

import { getDatabasePool } from '../utils/database';
import { UserEntity, UserRole, UserStatus } from '../types/auth.types';
import { NotFoundError, InternalServerError } from '../utils/errors';
import { mapUserRow } from '../utils/db-mapper';

/**
 * Find user by email
 * @param email - User email address
 * @returns User entity or null if not found
 */
export const findUserByEmail = async (email: string): Promise<UserEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapUserRow(result.rows[0]);
};

/**
 * Find user by ID
 * @param id - User ID
 * @returns User entity or null if not found
 */
export const findUserById = async (id: string): Promise<UserEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapUserRow(result.rows[0]);
};

/**
 * Find user by ICP number
 * @param icpNumber - ICP number
 * @returns User entity or null if not found
 */
export const findUserByIcpNumber = async (icpNumber: string): Promise<UserEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM users WHERE icp_number = $1 AND role = $2',
    [icpNumber, UserRole.USER],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapUserRow(result.rows[0]);
};

/**
 * Find user by unique link token
 * @param token - Unique link token
 * @returns User entity or null if not found
 */
export const findUserByUniqueLinkToken = async (token: string): Promise<UserEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM users WHERE unique_link_token = $1 AND role = $2',
    [token, UserRole.USER],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapUserRow(result.rows[0]);
};

/**
 * Create a new user (admin or regular user)
 * @param email - User email
 * @param role - User role (admin or user)
 * @param passwordHash - Hashed password (can be null)
 * @param icpNumber - ICP number (only for regular users, null for admins)
 * @param cityId - City ID (only for regular users, null for admins)
 * @param requirePassword - Whether password is required
 * @param uniqueLinkToken - Unique link token (only for users without password requirement, null otherwise)
 * @param status - User status (pending, approved, rejected)
 * @returns Created user entity
 */
export const createUser = async (
  email: string | null,
  role: UserRole,
  passwordHash: string | null,
  icpNumber: string | null,
  cityId: number | null,
  requirePassword: boolean,
  uniqueLinkToken: string | null = null,
  status: UserStatus = UserStatus.APPROVED,
): Promise<UserEntity> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    `INSERT INTO users (email, role, password_hash, icp_number, city_id, require_password, unique_link_token, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [email, role, passwordHash, icpNumber, cityId, requirePassword, uniqueLinkToken, status],
  );

  if (result.rows.length === 0) {
    throw new InternalServerError('Failed to create user');
  }

  return mapUserRow(result.rows[0]);
};

/**
 * Update user by ID
 * @param id - User ID
 * @param updates - Partial user data to update
 * @returns Updated user entity
 */
export const updateUser = async (
  id: string,
  updates: {
    email?: string | null;
    passwordHash?: string | null;
    icpNumber?: string | null;
    cityId?: number | null;
    requirePassword?: boolean;
    uniqueLinkToken?: string | null;
    status?: UserStatus;
  },
): Promise<UserEntity> => {
  const pool = getDatabasePool();
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.email !== undefined) {
    updateFields.push(`email = $${paramIndex}`);
    values.push(updates.email);
    paramIndex++;
  }

  if (updates.passwordHash !== undefined) {
    updateFields.push(`password_hash = $${paramIndex}`);
    values.push(updates.passwordHash);
    paramIndex++;
  }

  if (updates.icpNumber !== undefined) {
    updateFields.push(`icp_number = $${paramIndex}`);
    values.push(updates.icpNumber);
    paramIndex++;
  }

  if (updates.cityId !== undefined) {
    updateFields.push(`city_id = $${paramIndex}`);
    values.push(updates.cityId);
    paramIndex++;
  }

  if (updates.requirePassword !== undefined) {
    updateFields.push(`require_password = $${paramIndex}`);
    values.push(updates.requirePassword);
    paramIndex++;
  }

  if (updates.uniqueLinkToken !== undefined) {
    updateFields.push(`unique_link_token = $${paramIndex}`);
    values.push(updates.uniqueLinkToken);
    paramIndex++;
  }

  if (updates.status !== undefined) {
    updateFields.push(`status = $${paramIndex}`);
    values.push(updates.status);
    paramIndex++;
  }

  // Always update updated_at timestamp
  updateFields.push(`updated_at = NOW()`);

  if (updateFields.length === 1) {
    // Only updated_at was added, nothing to update
    const user = await findUserById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  values.push(id);
  const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  return mapUserRow(result.rows[0]);
};

/**
 * Delete user by ID
 * @param id - User ID
 * @returns True if user was deleted, false otherwise
 */
export const deleteUser = async (id: string): Promise<boolean> => {
  const pool = getDatabasePool();
  const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);

  return result.rowCount !== null && result.rowCount > 0;
};

/**
 * Find all admins
 * @returns Array of admin user entities
 */
export const findAllAdmins = async (): Promise<UserEntity[]> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC',
    [UserRole.ADMIN],
  );

  return result.rows.map(mapUserRow);
};

/**
 * Find all users (regular users, not admins) with city names
 * @returns Array of regular user entities with city names
 */
export const findAllUsers = async (): Promise<Array<UserEntity & { cityName?: string | null }>> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    `SELECT u.*, c.name as city_name
     FROM users u
     LEFT JOIN cities c ON u.city_id = c.id
     WHERE u.role = $1
     ORDER BY u.created_at DESC`,
    [UserRole.USER],
  );

  return result.rows.map((row) => ({
    ...mapUserRow(row),
    cityName: row.city_name || null,
  }));
};

/**
 * Find all pending users (awaiting approval)
 * @returns Array of pending user entities
 */
export const findPendingUsers = async (): Promise<UserEntity[]> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM users WHERE role = $1 AND status = $2 ORDER BY created_at DESC',
    [UserRole.USER, UserStatus.PENDING],
  );

  return result.rows.map(mapUserRow);
};

/**
 * Check if email already exists
 * @param email - Email to check
 * @param excludeId - Optional user ID to exclude from check (for updates)
 * @returns True if email exists, false otherwise
 */
export const emailExists = async (email: string, excludeId?: string): Promise<boolean> => {
  const pool = getDatabasePool();
  let query = 'SELECT COUNT(*) as count FROM users WHERE email = $1';
  const params: any[] = [email];

  if (excludeId) {
    query += ' AND id != $2';
    params.push(excludeId);
  }

  const result = await pool.query<{ count: string }>(query, params);
  return parseInt(result.rows[0].count, 10) > 0;
};

/**
 * Check if ICP number already exists
 * @param icpNumber - ICP number to check
 * @param excludeId - Optional user ID to exclude from check (for updates)
 * @returns True if ICP number exists, false otherwise
 */
export const icpNumberExists = async (icpNumber: string, excludeId?: string): Promise<boolean> => {
  const pool = getDatabasePool();
  let query = 'SELECT COUNT(*) as count FROM users WHERE icp_number = $1';
  const params: any[] = [icpNumber];

  if (excludeId) {
    query += ' AND id != $2';
    params.push(excludeId);
  }

  const result = await pool.query<{ count: string }>(query, params);
  return parseInt(result.rows[0].count, 10) > 0;
};

