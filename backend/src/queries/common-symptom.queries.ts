/**
 * Common symptom database queries
 * Handles all database operations for common symptoms
 */

import { getDatabasePool } from '../utils/database';
import { CommonSymptomEntity } from '../types/test.types';
import { NotFoundError, InternalServerError, ConflictError } from '../utils/errors';
import { mapCommonSymptomRow } from '../utils/db-mapper';

/**
 * Find common symptom by ID
 * @param id - Common symptom ID
 * @returns Common symptom entity or null if not found
 */
export const findCommonSymptomById = async (id: string): Promise<CommonSymptomEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM common_symptoms WHERE id = $1',
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapCommonSymptomRow(result.rows[0]);
};

/**
 * Find common symptom by name
 * @param name - Common symptom name
 * @returns Common symptom entity or null if not found
 */
export const findCommonSymptomByName = async (name: string): Promise<CommonSymptomEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM common_symptoms WHERE name = $1',
    [name],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapCommonSymptomRow(result.rows[0]);
};

/**
 * Get all common symptoms
 * @returns Array of common symptom entities
 */
export const findAllCommonSymptoms = async (): Promise<CommonSymptomEntity[]> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM common_symptoms ORDER BY name ASC',
  );

  return result.rows.map(mapCommonSymptomRow);
};

/**
 * Create a new common symptom
 * @param name - Common symptom name
 * @returns Created common symptom entity
 */
export const createCommonSymptom = async (name: string): Promise<CommonSymptomEntity> => {
  const pool = getDatabasePool();

  // Check if name already exists
  const existing = await findCommonSymptomByName(name);
  if (existing) {
    throw new ConflictError('Common symptom with this name already exists');
  }

  const result = await pool.query(
    'INSERT INTO common_symptoms (name) VALUES ($1) RETURNING *',
    [name],
  );

  if (result.rows.length === 0) {
    throw new InternalServerError('Failed to create common symptom');
  }

  return mapCommonSymptomRow(result.rows[0]);
};

/**
 * Update common symptom by ID
 * @param id - Common symptom ID
 * @param name - New common symptom name
 * @returns Updated common symptom entity
 */
export const updateCommonSymptom = async (id: string, name: string): Promise<CommonSymptomEntity> => {
  const pool = getDatabasePool();

  // Check if common symptom exists
  const existing = await findCommonSymptomById(id);
  if (!existing) {
    throw new NotFoundError('Common symptom not found');
  }

  // Check if new name already exists (excluding current common symptom)
  const nameExists = await findCommonSymptomByName(name);
  if (nameExists && nameExists.id !== id) {
    throw new ConflictError('Common symptom with this name already exists');
  }

  const result = await pool.query(
    'UPDATE common_symptoms SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [name, id],
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Common symptom not found');
  }

  return mapCommonSymptomRow(result.rows[0]);
};

/**
 * Delete common symptom by ID
 * @param id - Common symptom ID
 * @returns True if common symptom was deleted, false otherwise
 */
export const deleteCommonSymptom = async (id: string): Promise<boolean> => {
  const pool = getDatabasePool();

  // Check if common symptom exists
  const existing = await findCommonSymptomById(id);
  if (!existing) {
    throw new NotFoundError('Common symptom not found');
  }

  const result = await pool.query('DELETE FROM common_symptoms WHERE id = $1', [id]);

  return result.rowCount !== null && result.rowCount > 0;
};

