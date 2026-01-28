/**
 * Notification routes
 * Admin creates broadcast notifications, doctors see them until dismissed
 */

import { Router, Request, Response } from 'express';
import { authenticate, authenticateDoctor, requireAdmin, requireDoctor } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types/auth.types';
import {
  createNotificationService,
  dismissNotificationService,
  listMyNotificationsService,
  listNotificationsService,
} from '../services/notification.service';

const router = Router();

/**
 * Admin: create a notification
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const adminUserId = authReq.user!.userId;
    const created = await createNotificationService(req.body, adminUserId);
    res.status(201).json({ success: true, data: created });
  },
);

/**
 * Admin: list recent notifications
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const data = await listNotificationsService({ limit, offset });
    res.json({ success: true, data });
  },
);

/**
 * Doctor: get my notifications (undismissed), supports JWT or link token
 */
router.get(
  '/my',
  authenticateDoctor,
  requireDoctor,
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 3;
    const data = await listMyNotificationsService(authReq.user!.userId, limit);
    res.json({ success: true, data });
  },
);

/**
 * Doctor: dismiss notification, supports JWT or link token
 */
router.post(
  '/:id/dismiss',
  authenticateDoctor,
  requireDoctor,
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    await dismissNotificationService(req.params.id, authReq.user!.userId);
    res.json({ success: true });
  },
);

export default router;

