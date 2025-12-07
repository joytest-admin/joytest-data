import { Router, Request, Response } from 'express';
import { authenticate, authenticateDoctor, requireAdmin, requireDoctor } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createFeedbackService,
  getAllFeedbackService,
  getFeedbackByIdService,
  getDoctorFeedbackService,
  getDoctorFeedbackByIdService,
  updateFeedbackService,
} from '../services/feedback.service';
import {
  createFeedbackValidator,
  updateFeedbackValidator,
  getFeedbackValidator,
  getDoctorFeedbackValidator,
} from '../middleware/validators/feedback.validators';
import { AuthenticatedRequest } from '../types/auth.types';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Feedback management for doctors and admins
 */

/**
 * Doctor routes - use authenticateDoctor which supports both JWT and link tokens
 */

/**
 * @swagger
 * /api/feedback/my:
 *   get:
 *     summary: Get feedback submitted by the authenticated doctor
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page (default: 50)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Number of results to skip (default: 0)
 *     responses:
 *       200:
 *         description: List of feedback entries
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my',
  authenticateDoctor,
  requireDoctor,
  validateRequest(getDoctorFeedbackValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

    const result = await getDoctorFeedbackService(authReq.user!.userId, limit, offset);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/feedback/my/{id}:
 *   get:
 *     summary: Get a single feedback entry by ID (doctor only)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Feedback details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (feedback does not belong to doctor)
 *       404:
 *         description: Feedback not found
 */
router.get('/my/:id', authenticateDoctor, requireDoctor, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const feedback = await getDoctorFeedbackByIdService(authReq.user!.userId, req.params.id);
  res.json({ success: true, data: feedback });
});

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Create a new feedback entry (doctor only)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - subject
 *               - message
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [bug, feature_request, question, other]
 *               subject:
 *                 type: string
 *                 maxLength: 255
 *               message:
 *                 type: string
 *               contextUrl:
 *                 type: string
 *                 format: uri
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Feedback created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticateDoctor,
  requireDoctor,
  validateRequest(createFeedbackValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const feedback = await createFeedbackService(authReq.user!.userId, req.body);
    res.status(201).json({ success: true, data: feedback });
  },
);

/**
 * Admin routes - use standard authenticate (JWT only)
 */

/**
 * @swagger
 * /api/feedback:
 *   get:
 *     summary: Get all feedback entries (admin only)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, in_progress, resolved, closed]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [bug, feature_request, question, other]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *     responses:
 *       200:
 *         description: List of feedback entries with pagination
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  validateRequest(getFeedbackValidator),
  async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

    const result = await getAllFeedbackService({ status: status as any, category, limit, offset });
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/feedback/{id}:
 *   get:
 *     summary: Get feedback by ID (admin only)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Feedback details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Feedback not found
 */
router.get('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const feedback = await getFeedbackByIdService(req.params.id);
  res.json({ success: true, data: feedback });
});

/**
 * @swagger
 * /api/feedback/{id}:
 *   put:
 *     summary: Update feedback by ID (admin only)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [new, in_progress, resolved, closed]
 *               adminResponse:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Feedback updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Feedback not found
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateRequest(updateFeedbackValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const feedback = await updateFeedbackService(req.params.id, authReq.user!.userId, req.body);
    res.json({ success: true, data: feedback });
  },
);

export default router;

