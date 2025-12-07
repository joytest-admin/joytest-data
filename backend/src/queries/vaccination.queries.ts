/**
 * Vaccination database queries
 * Handles all database operations for vaccinations
 */

import { getDatabasePool } from '../utils/database';
import { VaccinationEntity } from '../types/test.types';
import { NotFoundError, InternalServerError, ConflictError } from '../utils/errors';
import { mapVaccinationRow } from '../utils/db-mapper';

/**
 * Find vaccination by ID
 * @param id - Vaccination ID
 * @returns Vaccination entity or null if not found
 */
export const findVaccinationById = async (id: string): Promise<VaccinationEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM vaccinations WHERE id = $1',
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapVaccinationRow(result.rows[0]);
};

/**
 * Find vaccination by name
 * @param name - Vaccination name
 * @returns Vaccination entity or null if not found
 */
export const findVaccinationByName = async (name: string): Promise<VaccinationEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM vaccinations WHERE name = $1',
    [name],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapVaccinationRow(result.rows[0]);
};

/**
 * Get all vaccinations
 * @returns Array of vaccination entities
 */
export const findAllVaccinations = async (): Promise<VaccinationEntity[]> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM vaccinations ORDER BY name ASC',
  );

  return result.rows.map(mapVaccinationRow);
};

/**
 * Create a new vaccination
 * @param name - Vaccination name
 * @returns Created vaccination entity
 */
export const createVaccination = async (name: string): Promise<VaccinationEntity> => {
  const pool = getDatabasePool();

  // Check if name already exists
  const existing = await findVaccinationByName(name);
  if (existing) {
    throw new ConflictError('Vaccination with this name already exists');
  }

  const result = await pool.query(
    'INSERT INTO vaccinations (name) VALUES ($1) RETURNING *',
    [name],
  );

  if (result.rows.length === 0) {
    throw new InternalServerError('Failed to create vaccination');
  }

  return mapVaccinationRow(result.rows[0]);
};

/**
 * Update vaccination by ID
 * @param id - Vaccination ID
 * @param name - New vaccination name
 * @returns Updated vaccination entity
 */
export const updateVaccination = async (id: string, name: string): Promise<VaccinationEntity> => {
  const pool = getDatabasePool();

  // Check if vaccination exists
  const existing = await findVaccinationById(id);
  if (!existing) {
    throw new NotFoundError('Vaccination not found');
  }

  // Check if new name already exists (excluding current vaccination)
  const nameExists = await findVaccinationByName(name);
  if (nameExists && nameExists.id !== id) {
    throw new ConflictError('Vaccination with this name already exists');
  }

  const result = await pool.query(
    'UPDATE vaccinations SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [name, id],
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Vaccination not found');
  }

  return mapVaccinationRow(result.rows[0]);
};

/**
 * Delete vaccination by ID
 * @param id - Vaccination ID
 * @returns True if vaccination was deleted, false otherwise
 */
export const deleteVaccination = async (id: string): Promise<boolean> => {
  const pool = getDatabasePool();

  // Check if vaccination exists
  const existing = await findVaccinationById(id);
  if (!existing) {
    throw new NotFoundError('Vaccination not found');
  }

  const result = await pool.query('DELETE FROM vaccinations WHERE id = $1', [id]);

  return result.rowCount !== null && result.rowCount > 0;
};

