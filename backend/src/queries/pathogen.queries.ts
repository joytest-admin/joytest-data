/**
 * Pathogen database queries
 * Handles all database operations for pathogens
 */

import { getDatabasePool } from '../utils/database';
import { PathogenEntity } from '../types/pathogen.types';
import { NotFoundError, InternalServerError, ConflictError } from '../utils/errors';

/**
 * Map database row to PathogenEntity
 */
const mapPathogenRow = (row: any): PathogenEntity => {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};

/**
 * Find pathogen by ID
 * @param id - Pathogen ID
 * @returns Pathogen entity or null if not found
 */
export const findPathogenById = async (id: string): Promise<PathogenEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM pathogens WHERE id = $1',
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapPathogenRow(result.rows[0]);
};

/**
 * Find pathogen by name
 * @param name - Pathogen name
 * @returns Pathogen entity or null if not found
 */
export const findPathogenByName = async (name: string): Promise<PathogenEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM pathogens WHERE name = $1',
    [name],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapPathogenRow(result.rows[0]);
};

/**
 * Get all pathogens
 * @returns Array of pathogen entities
 */
export const findAllPathogens = async (): Promise<PathogenEntity[]> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM pathogens ORDER BY name ASC',
  );

  return result.rows.map(mapPathogenRow);
};

/**
 * Create a new pathogen
 * @param name - Pathogen name
 * @returns Created pathogen entity
 */
export const createPathogen = async (name: string): Promise<PathogenEntity> => {
  const pool = getDatabasePool();

  // Check if name already exists
  const existing = await findPathogenByName(name);
  if (existing) {
    throw new ConflictError('Pathogen with this name already exists');
  }

  const result = await pool.query(
    'INSERT INTO pathogens (name) VALUES ($1) RETURNING *',
    [name],
  );

  if (result.rows.length === 0) {
    throw new InternalServerError('Failed to create pathogen');
  }

  return mapPathogenRow(result.rows[0]);
};

/**
 * Update pathogen by ID
 * @param id - Pathogen ID
 * @param name - New pathogen name
 * @returns Updated pathogen entity
 */
export const updatePathogen = async (id: string, name: string): Promise<PathogenEntity> => {
  const pool = getDatabasePool();

  // Check if pathogen exists
  const existing = await findPathogenById(id);
  if (!existing) {
    throw new NotFoundError('Pathogen not found');
  }

  // Check if new name already exists (excluding current pathogen)
  const nameExists = await findPathogenByName(name);
  if (nameExists && nameExists.id !== id) {
    throw new ConflictError('Pathogen with this name already exists');
  }

  const result = await pool.query(
    'UPDATE pathogens SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [name, id],
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Pathogen not found');
  }

  return mapPathogenRow(result.rows[0]);
};

/**
 * Delete pathogen by ID
 * @param id - Pathogen ID
 * @returns True if pathogen was deleted, false otherwise
 */
export const deletePathogen = async (id: string): Promise<boolean> => {
  const pool = getDatabasePool();

  // Check if pathogen exists
  const existing = await findPathogenById(id);
  if (!existing) {
    throw new NotFoundError('Pathogen not found');
  }

  const result = await pool.query('DELETE FROM pathogens WHERE id = $1', [id]);

  return result.rowCount !== null && result.rowCount > 0;
};

/**
 * Get pathogens for a test type
 * @param testTypeId - Test type ID
 * @returns Array of pathogen entities associated with the test type
 */
export const findPathogensByTestType = async (testTypeId: string): Promise<PathogenEntity[]> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    `SELECT p.* FROM pathogens p
     INNER JOIN test_type_pathogens ttp ON p.id = ttp.pathogen_id
     WHERE ttp.test_type_id = $1
     ORDER BY p.name ASC`,
    [testTypeId],
  );

  return result.rows.map(mapPathogenRow);
};

/**
 * Set pathogens for a test type (replaces existing associations)
 * @param testTypeId - Test type ID
 * @param pathogenIds - Array of pathogen IDs
 */
export const setTestTypePathogens = async (
  testTypeId: string,
  pathogenIds: string[],
): Promise<void> => {
  const pool = getDatabasePool();

  // Start transaction by deleting existing associations
  await pool.query('DELETE FROM test_type_pathogens WHERE test_type_id = $1', [testTypeId]);

  // Insert new associations
  if (pathogenIds.length > 0) {
    const values = pathogenIds.map((_, index) => `($1, $${index + 2})`).join(', ');
    const params = [testTypeId, ...pathogenIds];
    await pool.query(
      `INSERT INTO test_type_pathogens (test_type_id, pathogen_id) VALUES ${values}`,
      params,
    );
  }
};

