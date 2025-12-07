/**
 * Test type database queries
 * Handles all database operations for test types
 */

import { getDatabasePool } from '../utils/database';
import { TestTypeEntity } from '../types/test.types';
import { NotFoundError, InternalServerError, ConflictError } from '../utils/errors';
import { mapTestTypeRow } from '../utils/db-mapper';

/**
 * Find test type by ID
 * @param id - Test type ID
 * @returns Test type entity or null if not found
 */
export const findTestTypeById = async (id: string): Promise<TestTypeEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM test_types WHERE id = $1',
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapTestTypeRow(result.rows[0]);
};

/**
 * Find test type by name
 * @param name - Test type name
 * @returns Test type entity or null if not found
 */
export const findTestTypeByName = async (name: string): Promise<TestTypeEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM test_types WHERE name = $1',
    [name],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapTestTypeRow(result.rows[0]);
};

/**
 * Get all test types
 * @returns Array of test type entities
 */
export const findAllTestTypes = async (): Promise<TestTypeEntity[]> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM test_types ORDER BY name ASC',
  );

  return result.rows.map(mapTestTypeRow);
};

/**
 * Create a new test type
 * @param name - Test type name
 * @returns Created test type entity
 */
export const createTestType = async (name: string): Promise<TestTypeEntity> => {
  const pool = getDatabasePool();

  // Check if name already exists
  const existing = await findTestTypeByName(name);
  if (existing) {
    throw new ConflictError('Test type with this name already exists');
  }

  const result = await pool.query(
    'INSERT INTO test_types (name) VALUES ($1) RETURNING *',
    [name],
  );

  if (result.rows.length === 0) {
    throw new InternalServerError('Failed to create test type');
  }

  return mapTestTypeRow(result.rows[0]);
};

/**
 * Update test type by ID
 * @param id - Test type ID
 * @param name - New test type name
 * @returns Updated test type entity
 */
export const updateTestType = async (id: string, name: string): Promise<TestTypeEntity> => {
  const pool = getDatabasePool();

  // Check if test type exists
  const existing = await findTestTypeById(id);
  if (!existing) {
    throw new NotFoundError('Test type not found');
  }

  // Check if new name already exists (excluding current test type)
  const nameExists = await findTestTypeByName(name);
  if (nameExists && nameExists.id !== id) {
    throw new ConflictError('Test type with this name already exists');
  }

  const result = await pool.query(
    'UPDATE test_types SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [name, id],
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Test type not found');
  }

  return mapTestTypeRow(result.rows[0]);
};

/**
 * Delete test type by ID
 * @param id - Test type ID
 * @returns True if test type was deleted, false otherwise
 */
export const deleteTestType = async (id: string): Promise<boolean> => {
  const pool = getDatabasePool();

  // Check if test type exists
  const existing = await findTestTypeById(id);
  if (!existing) {
    throw new NotFoundError('Test type not found');
  }

  const result = await pool.query('DELETE FROM test_types WHERE id = $1', [id]);

  return result.rowCount !== null && result.rowCount > 0;
};

