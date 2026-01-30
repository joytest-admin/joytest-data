/**
 * Notification service
 * Business logic for admin announcements / notifications
 */

import { BadRequestError } from '../utils/errors';
import { CreateNotificationRequest, NotificationResponse } from '../types/notification.types';
import {
  createNotification,
  dismissNotificationForUser,
  listMyNotifications,
  listNotifications,
} from '../queries/notification.queries';

/**
 * Admin: create a new notification
 */
export const createNotificationService = async (
  data: CreateNotificationRequest,
  adminUserId: string,
): Promise<NotificationResponse> => {
  if (!data.type || !['info', 'warning', 'error'].includes(data.type)) {
    throw new BadRequestError('Invalid notification type');
  }
  if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
    throw new BadRequestError('Message is required');
  }

  let expiresAt: Date | null | undefined = undefined;
  if (data.expiresAt !== undefined) {
    if (data.expiresAt === null || data.expiresAt === '') {
      expiresAt = null;
    } else {
      const parsed = new Date(data.expiresAt);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestError('Invalid expiresAt format');
      }
      expiresAt = parsed;
    }
  }

  return createNotification({
    type: data.type,
    message: data.message.trim(),
    createdBy: adminUserId,
    expiresAt,
  });
};

/**
 * Admin: list recent notifications
 */
export const listNotificationsService = async (options?: {
  limit?: number;
  offset?: number;
}): Promise<NotificationResponse[]> => {
  return listNotifications(options);
};

/**
 * Doctor: list my (undismissed) notifications
 */
export const listMyNotificationsService = async (
  userId: string,
  limit = 3,
): Promise<NotificationResponse[]> => {
  return listMyNotifications(userId, limit);
};

/**
 * Doctor: dismiss a notification
 */
export const dismissNotificationService = async (
  notificationId: string,
  userId: string,
): Promise<void> => {
  if (!notificationId) {
    throw new BadRequestError('Notification id is required');
  }
  await dismissNotificationForUser(notificationId, userId);
};

