import { getDatabasePool } from '../utils/database';
import { PatientEntity } from '../types/patient.types';
import { mapPatientRow } from '../utils/db-mapper';
import { InternalServerError, NotFoundError } from '../utils/errors';

export const createPatient = async (
  doctorId: string,
  identifier: string,
  note?: string | null,
  yearOfBirth?: number | null,
): Promise<PatientEntity> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    `INSERT INTO patients (doctor_id, identifier, note, year_of_birth)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [doctorId, identifier, note || null, yearOfBirth || null],
  );

  if (result.rows.length === 0) {
    throw new InternalServerError('Failed to create patient');
  }

  return mapPatientRow(result.rows[0]);
};

export const updatePatient = async (
  id: string,
  updates: {
    identifier?: string;
    note?: string | null;
    yearOfBirth?: number | null;
  },
): Promise<PatientEntity> => {
  const pool = getDatabasePool();
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.identifier !== undefined) {
    updateFields.push(`identifier = $${paramIndex}`);
    values.push(updates.identifier);
    paramIndex++;
  }

  if (updates.note !== undefined) {
    updateFields.push(`note = $${paramIndex}`);
    values.push(updates.note);
    paramIndex++;
  }

  if (updates.yearOfBirth !== undefined) {
    updateFields.push(`year_of_birth = $${paramIndex}`);
    values.push(updates.yearOfBirth);
    paramIndex++;
  }

  updateFields.push('updated_at = NOW()');

  if (updateFields.length === 1) {
    const patient = await findPatientById(id);
    if (!patient) {
      throw new NotFoundError('Patient not found');
    }
    return patient;
  }

  values.push(id);
  const query = `UPDATE patients SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new NotFoundError('Patient not found');
  }

  return mapPatientRow(result.rows[0]);
};

export const deletePatient = async (id: string): Promise<boolean> => {
  const pool = getDatabasePool();
  const result = await pool.query('DELETE FROM patients WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
};

export const findPatientById = async (id: string): Promise<PatientEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return null;
  }
  return mapPatientRow(result.rows[0]);
};

export const findPatientsByDoctor = async (doctorId: string): Promise<PatientEntity[]> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    'SELECT * FROM patients WHERE doctor_id = $1 ORDER BY created_at DESC',
    [doctorId],
  );
  return result.rows.map(mapPatientRow);
};

export const findAllPatients = async (): Promise<PatientEntity[]> => {
  const pool = getDatabasePool();
  const result = await pool.query('SELECT * FROM patients ORDER BY created_at DESC');
  return result.rows.map(mapPatientRow);
};

/**
 * Search patients by identifier or note (fulltext search)
 * Only searches within patients belonging to the specified doctor
 * @param doctorId - Doctor ID to filter by
 * @param searchTerm - Search term to match against identifier or note
 * @param limit - Optional limit for results
 * @returns Array of matching patient entities
 */
export const searchPatientsByDoctor = async (
  doctorId: string,
  searchTerm: string,
  limit?: number,
): Promise<PatientEntity[]> => {
  const pool = getDatabasePool();
  const searchPattern = `%${searchTerm}%`;
  let query = `
    SELECT * FROM patients
    WHERE doctor_id = $1
      AND (
        identifier ILIKE $2
        OR note ILIKE $2
      )
    ORDER BY created_at DESC
  `;
  const params: any[] = [doctorId, searchPattern];

  if (limit) {
    query += ` LIMIT $3`;
    params.push(limit);
  }

  const result = await pool.query(query, params);
  return result.rows.map(mapPatientRow);
};

