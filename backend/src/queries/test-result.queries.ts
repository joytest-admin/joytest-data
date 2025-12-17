/**
 * Test result database queries
 * Handles all database operations for test results
 */

import { getDatabasePool } from '../utils/database';
import { TestResultEntity, TestResultResponse, TestResultVaccinationEntity } from '../types/test.types';
import { NotFoundError, InternalServerError } from '../utils/errors';
import { mapTestResultRow } from '../utils/db-mapper';

/**
 * Find test result by ID
 * @param id - Test result ID
 * @returns Test result entity or null if not found
 */
export const findTestResultById = async (id: string): Promise<TestResultEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    `    SELECT tr.*, tt.name as test_type_name, p.name as pathogen_name, pat.identifier as patient_identifier,
           c.name as city_name
     FROM test_results tr
     LEFT JOIN test_types tt ON tr.test_type_id = tt.id
     LEFT JOIN pathogens p ON tr.pathogen_id = p.id
     LEFT JOIN patients pat ON tr.patient_id = pat.id
     LEFT JOIN cities c ON tr.city_id = c.id
     WHERE tr.id = $1`,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapTestResultRow(result.rows[0]);
};

/**
 * Get all test results with optional filters
 * @param createdBy - Optional filter by creator user ID
 * @param limit - Optional limit for pagination
 * @param offset - Optional offset for pagination
 * @returns Array of test result responses with joined data
 */
export const findAllTestResults = async (
  createdBy?: string,
  limit?: number,
  offset?: number,
): Promise<TestResultResponse[]> => {
  const pool = getDatabasePool();
  let query = `
    SELECT tr.*, tt.name as test_type_name, p.name as pathogen_name, pat.identifier as patient_identifier,
           c.name as city_name
    FROM test_results tr
    LEFT JOIN test_types tt ON tr.test_type_id = tt.id
    LEFT JOIN pathogens p ON tr.pathogen_id = p.id
    LEFT JOIN patients pat ON tr.patient_id = pat.id
    LEFT JOIN cities c ON tr.city_id = c.id
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (createdBy) {
    query += ` WHERE tr.created_by = $${paramIndex}`;
    params.push(createdBy);
    paramIndex++;
  }

  query += ' ORDER BY tr.created_at DESC';

  if (limit !== undefined) {
    query += ` LIMIT $${paramIndex}`;
    params.push(limit);
    paramIndex++;
    if (offset !== undefined) {
      query += ` OFFSET $${paramIndex}`;
      params.push(offset);
    }
  }

  const result = await pool.query(query, params);

  return result.rows.map((row) => ({
    id: row.id,
    cityId: row.city_id,
    cityName: row.city_name || null,
    icpNumber: row.icp_number,
    testTypeId: row.test_type_id,
    testTypeName: row.test_type_name,
    dateOfBirth: row.date_of_birth,
    testDate: row.test_date,
    symptoms: row.symptoms || [],
    pathogenId: row.pathogen_id || null,
    pathogenName: row.pathogen_name || null,
    otherInformations: row.other_informations,
    sari: row.sari,
    atb: row.atb,
    antivirals: row.antivirals,
    obesity: row.obesity,
    respiratorySupport: row.respiratory_support,
    ecmo: row.ecmo,
    pregnancy: row.pregnancy,
    trimester: row.trimester || null,
    patientId: row.patient_id || null,
    patientIdentifier: row.patient_identifier || null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

/**
 * Find test results for a specific doctor with advanced filtering, sorting, and pagination
 * @param doctorId - Doctor ID
 * @param options - Filter, sort, and pagination options
 * @returns Object with results array and total count
 */
export const findDoctorTestResults = async (
  doctorId: string,
  options: {
    search?: string;
    city?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: 'created_at' | 'date_of_birth' | 'city' | 'test_type_name' | 'pathogen_name' | 'patient_identifier';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  },
): Promise<{ results: TestResultResponse[]; total: number }> => {
  const pool = getDatabasePool();
  const { search, city, startDate, endDate, sortBy = 'created_at', sortOrder = 'desc', limit = 20, offset = 0 } = options;

  let query = `
    SELECT
      tr.*,
      tt.name as test_type_name,
      p.name as pathogen_name,
      pat.identifier as patient_identifier,
      c.name as city_name,
      COUNT(*) OVER() AS full_count
    FROM test_results tr
    LEFT JOIN test_types tt ON tr.test_type_id = tt.id
    LEFT JOIN pathogens p ON tr.pathogen_id = p.id
    LEFT JOIN patients pat ON tr.patient_id = pat.id
    LEFT JOIN cities c ON tr.city_id = c.id
    WHERE tr.created_by = $1
  `;
  const params: any[] = [doctorId];
  let paramIndex = 2;

  if (search) {
    query += `
      AND (
        c.name ILIKE $${paramIndex} OR
        tt.name ILIKE $${paramIndex} OR
        p.name ILIKE $${paramIndex} OR
        pat.identifier ILIKE $${paramIndex} OR
        tr.icp_number ILIKE $${paramIndex}
      )
    `;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (city) {
    query += ` AND c.name ILIKE $${paramIndex}`;
    params.push(`%${city}%`);
    paramIndex++;
  }

  if (startDate) {
    query += ` AND tr.created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    query += ` AND tr.created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  // Map sortable columns to their actual table columns or joined names
  const sortColumnMap: Record<string, string> = {
    created_at: 'tr.created_at',
    date_of_birth: 'tr.date_of_birth',
    city: 'c.name',
    test_type_name: 'tt.name',
    pathogen_name: 'p.name',
    patient_identifier: 'pat.identifier',
  };

  const actualSortBy = sortColumnMap[sortBy] || 'tr.created_at';
  const actualSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

  query += ` ORDER BY ${actualSortBy} ${actualSortOrder}`;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  const total = result.rows.length > 0 ? parseInt(result.rows[0].full_count, 10) : 0;
  const results = result.rows.map((row) => ({
    id: row.id,
    cityId: row.city_id,
    cityName: row.city_name || null,
    icpNumber: row.icp_number,
    testTypeId: row.test_type_id,
    testTypeName: row.test_type_name,
    dateOfBirth: row.date_of_birth,
    testDate: row.test_date,
    symptoms: row.symptoms || [],
    pathogenId: row.pathogen_id || null,
    pathogenName: row.pathogen_name || null,
    otherInformations: row.other_informations,
    sari: row.sari,
    atb: row.atb,
    antivirals: row.antivirals,
    obesity: row.obesity,
    respiratorySupport: row.respiratory_support,
    ecmo: row.ecmo,
    pregnancy: row.pregnancy,
    trimester: row.trimester || null,
    patientId: row.patient_id || null,
    patientIdentifier: row.patient_identifier || null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return { results, total };
};

/**
 * Find test results by date interval for a specific doctor with optional city filter
 * @param doctorId - Doctor ID
 * @param startDate - Optional start date (ISO string)
 * @param endDate - Optional end date (ISO string)
 * @param city - Optional city filter (partial match)
 * @returns Array of test result responses
 */
export const findDoctorTestResultsByInterval = async (
  doctorId: string,
  startDate?: string,
  endDate?: string,
  city?: string,
): Promise<TestResultResponse[]> => {
  const pool = getDatabasePool();

  let query = `
    SELECT
      tr.*,
      tt.name as test_type_name,
      p.name as pathogen_name,
      pat.identifier as patient_identifier,
      c.name as city_name,
    FROM test_results tr
    LEFT JOIN test_types tt ON tr.test_type_id = tt.id
    LEFT JOIN pathogens p ON tr.pathogen_id = p.id
    LEFT JOIN patients pat ON tr.patient_id = pat.id
    LEFT JOIN cities c ON tr.city_id = c.id
    WHERE tr.created_by = $1
  `;
  const params: any[] = [doctorId];
  let paramIndex = 2;

  if (startDate) {
    query += ` AND tr.created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    query += ` AND tr.created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  if (city) {
    query += ` AND c.name ILIKE $${paramIndex}`;
    params.push(`%${city}%`);
    paramIndex++;
  }

  query += ' ORDER BY tr.created_at DESC';

  const result = await pool.query(query, params);

  return result.rows.map((row) => ({
    id: row.id,
    cityId: row.city_id,
    cityName: row.city_name || null,
    icpNumber: row.icp_number,
    testTypeId: row.test_type_id,
    testTypeName: row.test_type_name,
    dateOfBirth: row.date_of_birth,
    testDate: row.test_date,
    symptoms: row.symptoms || [],
    pathogenId: row.pathogen_id || null,
    pathogenName: row.pathogen_name || null,
    otherInformations: row.other_informations,
    sari: row.sari,
    atb: row.atb,
    antivirals: row.antivirals,
    obesity: row.obesity,
    respiratorySupport: row.respiratory_support,
    ecmo: row.ecmo,
    pregnancy: row.pregnancy,
    trimester: row.trimester || null,
    patientId: row.patient_id || null,
    patientIdentifier: row.patient_identifier || null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

/**
 * Find test results by patient ID for a specific doctor
 * @param doctorId - Doctor ID
 * @param patientId - Patient ID
 * @returns Array of test result responses
 */
export const findDoctorTestResultsByPatient = async (
  doctorId: string,
  patientId: string,
): Promise<TestResultResponse[]> => {
  const pool = getDatabasePool();

  const query = `
    SELECT
      tr.*,
      tt.name as test_type_name,
      p.name as pathogen_name,
      pat.identifier as patient_identifier,
      c.name as city_name,
    FROM test_results tr
    LEFT JOIN test_types tt ON tr.test_type_id = tt.id
    LEFT JOIN pathogens p ON tr.pathogen_id = p.id
    LEFT JOIN patients pat ON tr.patient_id = pat.id
    LEFT JOIN cities c ON tr.city_id = c.id
    WHERE tr.created_by = $1
      AND tr.patient_id = $2
    ORDER BY tr.created_at DESC
  `;

  const result = await pool.query(query, [doctorId, patientId]);

  return result.rows.map((row) => ({
    id: row.id,
    cityId: row.city_id,
    cityName: row.city_name || null,
    icpNumber: row.icp_number,
    testTypeId: row.test_type_id,
    testTypeName: row.test_type_name,
    dateOfBirth: row.date_of_birth,
    testDate: row.test_date,
    symptoms: row.symptoms || [],
    pathogenId: row.pathogen_id || null,
    pathogenName: row.pathogen_name || null,
    otherInformations: row.other_informations,
    sari: row.sari,
    atb: row.atb,
    antivirals: row.antivirals,
    obesity: row.obesity,
    respiratorySupport: row.respiratory_support,
    ecmo: row.ecmo,
    pregnancy: row.pregnancy,
    trimester: row.trimester || null,
    patientId: row.patient_id || null,
    patientIdentifier: row.patient_identifier || null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

/**
 * Create a new test result
 * @param data - Test result data
 * @param createdBy - User ID of the creator
 * @returns Created test result entity
 */
export const createTestResult = async (
  data: {
    cityId: number;
    icpNumber: string;
    testTypeId: string;
    dateOfBirth: Date;
    testDate: Date;
    symptoms: string[];
    pathogenId?: string | null;
    otherInformations?: string | null;
    sari?: boolean | null;
    atb?: boolean | null;
    antivirals?: boolean | null;
    obesity?: boolean | null;
    respiratorySupport?: boolean | null;
    ecmo?: boolean | null;
    pregnancy?: boolean | null;
    trimester?: number | null;
    patientId?: string | null;
  },
  createdBy: string,
): Promise<TestResultEntity> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    `INSERT INTO test_results (
      city_id, icp_number, test_type_id, date_of_birth, test_date, symptoms, pathogen_id,
      other_informations, sari, atb, antivirals, obesity,
      respiratory_support, ecmo, pregnancy, trimester, patient_id, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`,
    [
      data.cityId,
      data.icpNumber,
      data.testTypeId,
      data.dateOfBirth,
      data.testDate,
      data.symptoms,
      data.pathogenId || null,
      data.otherInformations || null,
      data.sari ?? null,
      data.atb ?? null,
      data.antivirals ?? null,
      data.obesity ?? null,
      data.respiratorySupport ?? null,
      data.ecmo ?? null,
      data.pregnancy ?? null,
      data.trimester ?? null,
      data.patientId || null,
      createdBy,
    ],
  );

  if (result.rows.length === 0) {
    throw new InternalServerError('Failed to create test result');
  }

  return mapTestResultRow(result.rows[0]);
};

/**
 * Update test result by ID
 * @param id - Test result ID
 * @param data - Partial test result data to update
 * @returns Updated test result entity
 */
export const updateTestResult = async (
  id: string,
  data: {
    cityId?: number;
    testTypeId?: string;
    dateOfBirth?: Date;
    testDate?: Date;
    symptoms?: string[];
    pathogenId?: string | null;
    otherInformations?: string | null;
    sari?: boolean | null;
    atb?: boolean | null;
    antivirals?: boolean | null;
    obesity?: boolean | null;
    respiratorySupport?: boolean | null;
    ecmo?: boolean | null;
    pregnancy?: boolean | null;
    patientId?: string | null;
  },
): Promise<TestResultEntity> => {
  const pool = getDatabasePool();
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.cityId !== undefined) {
    updateFields.push(`city_id = $${paramIndex}`);
    values.push(data.cityId);
    paramIndex++;
  }

  if (data.testTypeId !== undefined) {
    updateFields.push(`test_type_id = $${paramIndex}`);
    values.push(data.testTypeId);
    paramIndex++;
  }

  if (data.dateOfBirth !== undefined) {
    updateFields.push(`date_of_birth = $${paramIndex}`);
    values.push(data.dateOfBirth);
    paramIndex++;
  }

  if (data.testDate !== undefined) {
    updateFields.push(`test_date = $${paramIndex}`);
    values.push(data.testDate);
    paramIndex++;
  }

  if (data.symptoms !== undefined) {
    updateFields.push(`symptoms = $${paramIndex}`);
    values.push(data.symptoms);
    paramIndex++;
  }

  if (data.pathogenId !== undefined) {
    updateFields.push(`pathogen_id = $${paramIndex}`);
    values.push(data.pathogenId);
    paramIndex++;
  }

  if (data.otherInformations !== undefined) {
    updateFields.push(`other_informations = $${paramIndex}`);
    values.push(data.otherInformations);
    paramIndex++;
  }

  if (data.sari !== undefined) {
    updateFields.push(`sari = $${paramIndex}`);
    values.push(data.sari);
    paramIndex++;
  }

  if (data.atb !== undefined) {
    updateFields.push(`atb = $${paramIndex}`);
    values.push(data.atb);
    paramIndex++;
  }

  if (data.antivirals !== undefined) {
    updateFields.push(`antivirals = $${paramIndex}`);
    values.push(data.antivirals);
    paramIndex++;
  }

  if (data.obesity !== undefined) {
    updateFields.push(`obesity = $${paramIndex}`);
    values.push(data.obesity);
    paramIndex++;
  }

  if (data.respiratorySupport !== undefined) {
    updateFields.push(`respiratory_support = $${paramIndex}`);
    values.push(data.respiratorySupport);
    paramIndex++;
  }

  if (data.ecmo !== undefined) {
    updateFields.push(`ecmo = $${paramIndex}`);
    values.push(data.ecmo);
    paramIndex++;
  }

  if (data.pregnancy !== undefined) {
    updateFields.push(`pregnancy = $${paramIndex}`);
    values.push(data.pregnancy);
    paramIndex++;
  }

  if (data.patientId !== undefined) {
    updateFields.push(`patient_id = $${paramIndex}`);
    values.push(data.patientId);
    paramIndex++;
  }

  updateFields.push('updated_at = NOW()');

  if (updateFields.length === 1) {
    // Only updated_at was added, no actual updates
    const testResult = await findTestResultById(id);
    if (!testResult) {
      throw new NotFoundError('Test result not found');
    }
    return mapTestResultRow((await pool.query('SELECT * FROM test_results WHERE id = $1', [id])).rows[0]);
  }

  values.push(id);
  const query = `UPDATE test_results SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new NotFoundError('Test result not found');
  }

  return mapTestResultRow(result.rows[0]);
};

/**
 * Delete test result by ID
 * @param id - Test result ID
 * @returns True if deleted, false otherwise
 */
export const deleteTestResult = async (id: string): Promise<boolean> => {
  const pool = getDatabasePool();
  const result = await pool.query('DELETE FROM test_results WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
};

/**
 * Delete all test results created by a specific user
 * This also handles deletion of related test_result_vaccinations via CASCADE or manual deletion
 * @param userId - User ID (created_by)
 * @param client - Optional database client (for transactions). If not provided, uses pool
 * @returns Number of test results deleted
 */
export const deleteTestResultsByUserId = async (userId: string, client?: any): Promise<number> => {
  const queryClient = client || getDatabasePool();
  
  // First, delete all test_result_vaccinations for test results created by this user
  // (if CASCADE is not set, we need to delete manually)
  await queryClient.query(
    `DELETE FROM test_result_vaccinations 
     WHERE test_result_id IN (SELECT id FROM test_results WHERE created_by = $1)`,
    [userId],
  );
  
  // Then delete all test results created by this user
  const result = await queryClient.query('DELETE FROM test_results WHERE created_by = $1', [userId]);
  
  return result.rowCount || 0;
};

/**
 * Find test results by patient ID (for admin or patient queries)
 * @param patientId - Patient ID
 * @returns Array of test result entities
 */
export const findTestResultsByPatient = async (patientId: string): Promise<TestResultEntity[]> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    `    SELECT tr.*, tt.name as test_type_name, p.name as pathogen_name, pat.identifier as patient_identifier,
           c.name as city_name
     FROM test_results tr
     LEFT JOIN test_types tt ON tr.test_type_id = tt.id
     LEFT JOIN pathogens p ON tr.pathogen_id = p.id
     LEFT JOIN patients pat ON tr.patient_id = pat.id
     LEFT JOIN cities c ON tr.city_id = c.id
     WHERE tr.patient_id = $1
     ORDER BY tr.created_at DESC`,
    [patientId],
  );

  return result.rows.map(mapTestResultRow);
};

/**
 * Find test results for admin with filters and pagination
 * @param options - Filter and pagination options
 * @returns Object with results array and total count
 */
export const findAdminTestResults = async (options: {
  city?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<{ results: TestResultResponse[]; total: number }> => {
  const pool = getDatabasePool();
  const { city, doctorId, startDate, endDate, limit = 20, offset = 0 } = options;

  let query = `
    SELECT
      tr.*,
      tt.name as test_type_name,
      p.name as pathogen_name,
      pat.identifier as patient_identifier,
      u.icp_number as doctor_icp_number,
      u.email as doctor_email,
      c.name as city_name,
      COUNT(*) OVER() AS full_count
    FROM test_results tr
    LEFT JOIN test_types tt ON tr.test_type_id = tt.id
    LEFT JOIN pathogens p ON tr.pathogen_id = p.id
    LEFT JOIN patients pat ON tr.patient_id = pat.id
    LEFT JOIN users u ON tr.created_by = u.id
    LEFT JOIN cities c ON tr.city_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (city) {
    query += ` AND c.name ILIKE $${paramIndex}`;
    params.push(`%${city}%`);
    paramIndex++;
  }

  if (doctorId) {
    query += ` AND tr.created_by = $${paramIndex}`;
    params.push(doctorId);
    paramIndex++;
  }

  if (startDate) {
    query += ` AND tr.created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    query += ` AND tr.created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  query += ' ORDER BY tr.created_at DESC';
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  const total = result.rows.length > 0 ? parseInt(result.rows[0].full_count, 10) : 0;
  const results = result.rows.map((row) => ({
    id: row.id,
    cityId: row.city_id,
    cityName: row.city_name || null,
    icpNumber: row.icp_number,
    testTypeId: row.test_type_id,
    testTypeName: row.test_type_name,
    dateOfBirth: row.date_of_birth,
    testDate: row.test_date,
    symptoms: row.symptoms || [],
    pathogenId: row.pathogen_id || null,
    pathogenName: row.pathogen_name || null,
    otherInformations: row.other_informations,
    sari: row.sari,
    atb: row.atb,
    antivirals: row.antivirals,
    obesity: row.obesity,
    respiratorySupport: row.respiratory_support,
    ecmo: row.ecmo,
    pregnancy: row.pregnancy,
    trimester: row.trimester || null,
    patientId: row.patient_id || null,
    patientIdentifier: row.patient_identifier || null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return { results, total };
};

/**
 * Find test results for admin export with filters
 * @param options - Filter options (city, doctorId, startDate, endDate)
 * @returns Array of test result responses
 */
export const findAdminTestResultsForExport = async (options: {
  city?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<TestResultResponse[]> => {
  const pool = getDatabasePool();
  const { city, doctorId, startDate, endDate } = options;

  let query = `
    SELECT
      tr.*,
      tt.name as test_type_name,
      p.name as pathogen_name,
      pat.identifier as patient_identifier,
      u.icp_number as doctor_icp_number,
      u.email as doctor_email,
      c.name as city_name
    FROM test_results tr
    LEFT JOIN test_types tt ON tr.test_type_id = tt.id
    LEFT JOIN pathogens p ON tr.pathogen_id = p.id
    LEFT JOIN patients pat ON tr.patient_id = pat.id
    LEFT JOIN users u ON tr.created_by = u.id
    LEFT JOIN cities c ON tr.city_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (city) {
    query += ` AND c.name ILIKE $${paramIndex}`;
    params.push(`%${city}%`);
    paramIndex++;
  }

  if (doctorId) {
    query += ` AND tr.created_by = $${paramIndex}`;
    params.push(doctorId);
    paramIndex++;
  }

  if (startDate) {
    query += ` AND tr.created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    query += ` AND tr.created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  query += ' ORDER BY tr.created_at DESC';

  const result = await pool.query(query, params);

  return result.rows.map((row) => ({
    id: row.id,
    cityId: row.city_id,
    icpNumber: row.icp_number,
    testTypeId: row.test_type_id,
    testTypeName: row.test_type_name,
    dateOfBirth: row.date_of_birth,
    testDate: row.test_date,
    symptoms: row.symptoms || [],
    pathogenId: row.pathogen_id || null,
    pathogenName: row.pathogen_name || null,
    otherInformations: row.other_informations,
    sari: row.sari,
    atb: row.atb,
    antivirals: row.antivirals,
    obesity: row.obesity,
    respiratorySupport: row.respiratory_support,
    ecmo: row.ecmo,
    pregnancy: row.pregnancy,
    trimester: row.trimester || null,
    patientId: row.patient_id || null,
    patientIdentifier: row.patient_identifier || null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

/**
 * Find all vaccinations for a test result
 * @param testResultId - Test result ID
 * @returns Array of test result vaccination entities
 */
export const findTestResultVaccinationsByTestResultId = async (
  testResultId: string,
): Promise<TestResultVaccinationEntity[]> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    `SELECT trv.*
     FROM test_result_vaccinations trv
     WHERE trv.test_result_id = $1
     ORDER BY trv.vaccination_date DESC, trv.created_at DESC`,
    [testResultId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    testResultId: row.test_result_id,
    vaccinationId: row.vaccination_id,
    vaccineName: row.vaccine_name,
    batchNumber: row.batch_number,
    vaccinationDate: row.vaccination_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

/**
 * Create a test result vaccination
 * @param data - Vaccination data
 * @returns Created test result vaccination entity
 */
export const createTestResultVaccination = async (
  data: {
    testResultId: string;
    vaccinationId: string;
    vaccineName?: string | null;
    batchNumber?: string | null;
    vaccinationDate?: Date | null;
  },
): Promise<TestResultVaccinationEntity> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    `INSERT INTO test_result_vaccinations (test_result_id, vaccination_id, vaccine_name, batch_number, vaccination_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.testResultId, data.vaccinationId, data.vaccineName || null, data.batchNumber || null, data.vaccinationDate || null],
  );

  if (result.rows.length === 0) {
    throw new InternalServerError('Failed to create test result vaccination');
  }

  const row = result.rows[0];
  return {
    id: row.id,
    testResultId: row.test_result_id,
    vaccinationId: row.vaccination_id,
    vaccineName: row.vaccine_name,
    batchNumber: row.batch_number,
    vaccinationDate: row.vaccination_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * Delete all vaccinations for a test result
 * @param testResultId - Test result ID
 * @returns True if any rows were deleted
 */
export const deleteTestResultVaccinationsByTestResultId = async (testResultId: string): Promise<boolean> => {
  const pool = getDatabasePool();
  const result = await pool.query('DELETE FROM test_result_vaccinations WHERE test_result_id = $1', [testResultId]);
  return result.rowCount !== null && result.rowCount > 0;
};
