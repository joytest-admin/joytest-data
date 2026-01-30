/**
 * Notification-related type definitions
 */

export type NotificationType = 'info' | 'warning' | 'error';

/**
 * Notification entity (stored in database)
 */
export interface NotificationEntity {
  id: string;
  type: NotificationType;
  message: string;
  createdBy: string;
  active: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification dismissal entity (stored in database)
 */
export interface NotificationDismissalEntity {
  id: string;
  notificationId: string;
  userId: string;
  dismissedAt: Date;
}

/**
 * Admin create notification request
 */
export interface CreateNotificationRequest {
  type: NotificationType;
  message: string;
  expiresAt?: string | null; // ISO timestamp, optional
}

/**
 * Notification response returned to clients
 */
export interface NotificationResponse {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: string; // ISO string
}

