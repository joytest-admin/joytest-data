/**
 * Notification database queries
 */

import { getDatabasePool } from '../utils/database';
import { NotificationResponse, NotificationType } from '../types/notification.types';

/**
 * Create a notification (admin)
 */
export const createNotification = async (data: {
  type: NotificationType;
  message: string;
  createdBy: string;
  expiresAt?: Date | null;
}): Promise<NotificationResponse> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    `INSERT INTO notifications (type, message, created_by, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, type, message, created_at`,
    [data.type, data.message, data.createdBy, data.expiresAt ?? null],
  );

  const row = result.rows[0];
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    createdAt: new Date(row.created_at).toISOString(),
  };
};

/**
 * List recent notifications (admin)
 */
export const listNotifications = async (options?: {
  limit?: number;
  offset?: number;
}): Promise<NotificationResponse[]> => {
  const pool = getDatabasePool();
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const result = await pool.query(
    `SELECT id, type, message, created_at
     FROM notifications
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.type,
    message: row.message,
    createdAt: new Date(row.created_at).toISOString(),
  }));
};

/**
 * List notifications for a user (doctor): active, not expired, not dismissed by this user
 */
export const listMyNotifications = async (userId: string, limit = 3): Promise<NotificationResponse[]> => {
  const pool = getDatabasePool();
  const result = await pool.query(
    `SELECT n.id, n.type, n.message, n.created_at
     FROM notifications n
     WHERE n.active = true
       AND (n.expires_at IS NULL OR n.expires_at > now())
       AND NOT EXISTS (
         SELECT 1
         FROM notification_dismissals nd
         WHERE nd.notification_id = n.id
           AND nd.user_id = $1
       )
     ORDER BY n.created_at DESC
     LIMIT $2`,
    [userId, limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.type,
    message: row.message,
    createdAt: new Date(row.created_at).toISOString(),
  }));
};

/**
 * Dismiss a notification for a user (doctor)
 */
export const dismissNotificationForUser = async (notificationId: string, userId: string): Promise<void> => {
  const pool = getDatabasePool();
  await pool.query(
    `INSERT INTO notification_dismissals (notification_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (notification_id, user_id) DO NOTHING`,
    [notificationId, userId],
  );
};

