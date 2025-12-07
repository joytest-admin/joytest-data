/**
 * Feedback database queries
 * Handles all database operations for feedback
 */

import { getDatabasePool } from '../utils/database';
import { FeedbackEntity, FeedbackCategory, FeedbackStatus } from '../types/feedback.types';
import { NotFoundError, InternalServerError } from '../utils/errors';
import { mapFeedbackRow } from '../utils/db-mapper';

/**
 * Create a new feedback entry
 * @param doctorId - Doctor ID who submitted the feedback
 * @param category - Feedback category
 * @param subject - Feedback subject
 * @param message - Feedback message
 * @param contextUrl - Optional context URL
 * @returns Created feedback entity
 */
export const createFeedback = async (
  doctorId: string,
  category: FeedbackCategory,
  subject: string,
  message: string,
  contextUrl?: string | null,
): Promise<FeedbackEntity> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    `INSERT INTO feedback (doctor_id, category, subject, message, context_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [doctorId, category, subject, message, contextUrl || null],
  );

  if (result.rows.length === 0) {
    throw new InternalServerError('Failed to create feedback');
  }

  return mapFeedbackRow(result.rows[0]);
};

/**
 * Find feedback by ID
 * @param id - Feedback ID
 * @returns Feedback entity or null if not found
 */
export const findFeedbackById = async (id: string): Promise<FeedbackEntity | null> => {
  const pool = getDatabasePool();
  const result = await pool.query('SELECT * FROM feedback WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    return null;
  }

  return mapFeedbackRow(result.rows[0]);
};

/**
 * Find all feedback entries with optional filters (admin only)
 * @param options - Filter options
 * @returns Object with feedback results and total count
 */
export const findAllFeedback = async (options: {
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  limit?: number;
  offset?: number;
}): Promise<{ results: FeedbackEntity[]; total: number }> => {
  const pool = getDatabasePool();
  const { status, category, limit = 50, offset = 0 } = options;

  let query = `
    SELECT f.*, COUNT(*) OVER() AS full_count
    FROM feedback f
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (status) {
    query += ` AND f.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (category) {
    query += ` AND f.category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  query += ` ORDER BY f.created_at DESC`;
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  const total = result.rows.length > 0 ? parseInt(result.rows[0].full_count, 10) : 0;
  const results = result.rows.map((row) => mapFeedbackRow(row));

  return { results, total };
};

/**
 * Find feedback entries by doctor ID
 * @param doctorId - Doctor ID
 * @param limit - Optional limit for pagination
 * @param offset - Optional offset for pagination
 * @returns Object with feedback results and total count
 */
export const findFeedbackByDoctor = async (
  doctorId: string,
  limit?: number,
  offset?: number,
): Promise<{ results: FeedbackEntity[]; total: number }> => {
  const pool = getDatabasePool();
  const limitValue = limit || 50;
  const offsetValue = offset || 0;

  const result = await pool.query(
    `SELECT f.*, COUNT(*) OVER() AS full_count
     FROM feedback f
     WHERE f.doctor_id = $1
     ORDER BY f.created_at DESC
     LIMIT $2 OFFSET $3`,
    [doctorId, limitValue, offsetValue],
  );

  const total = result.rows.length > 0 ? parseInt(result.rows[0].full_count, 10) : 0;
  const results = result.rows.map((row) => mapFeedbackRow(row));

  return { results, total };
};

/**
 * Update feedback by ID
 * @param id - Feedback ID
 * @param updates - Partial feedback data to update
 * @returns Updated feedback entity
 */
export const updateFeedback = async (
  id: string,
  updates: {
    status?: FeedbackStatus;
    adminId?: string | null;
    adminResponse?: string | null;
  },
): Promise<FeedbackEntity> => {
  const pool = getDatabasePool();
  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.status !== undefined) {
    updateFields.push(`status = $${paramIndex}`);
    values.push(updates.status);
    paramIndex++;

    // If status is resolved or closed, set resolved_at
    if (updates.status === FeedbackStatus.RESOLVED || updates.status === FeedbackStatus.CLOSED) {
      updateFields.push(`resolved_at = NOW()`);
    } else {
      // If status changes from resolved/closed to something else, clear resolved_at
      updateFields.push(`resolved_at = NULL`);
    }
  }

  if (updates.adminId !== undefined) {
    updateFields.push(`admin_id = $${paramIndex}`);
    values.push(updates.adminId);
    paramIndex++;
  }

  if (updates.adminResponse !== undefined) {
    updateFields.push(`admin_response = $${paramIndex}`);
    values.push(updates.adminResponse);
    paramIndex++;
  }

  updateFields.push('updated_at = NOW()');

  if (updateFields.length === 1) {
    // Only updated_at was added, no actual updates
    const feedback = await findFeedbackById(id);
    if (!feedback) {
      throw new NotFoundError('Feedback not found');
    }
    return feedback;
  }

  values.push(id);
  const query = `UPDATE feedback SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new NotFoundError('Feedback not found');
  }

  return mapFeedbackRow(result.rows[0]);
};

