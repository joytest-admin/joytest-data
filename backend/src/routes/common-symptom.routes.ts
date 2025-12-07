/**
 * Common symptom routes
 * Handles all common symptom-related endpoints
 */

import { Router, Request, Response } from 'express';
import {
  getAllCommonSymptoms,
  getCommonSymptomById,
  createCommonSymptomService,
  updateCommonSymptomService,
  deleteCommonSymptomService,
} from '../services/common-symptom.service';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createCommonSymptomValidator,
  updateCommonSymptomValidator,
} from '../middleware/validators/test.validators';

const router = Router();

/**
 * @swagger
 * /api/common-symptoms:
 *   get:
 *     summary: Get all common symptoms (public endpoint)
 *     tags: [Common Symptoms]
 *     responses:
 *       200:
 *         description: List of common symptoms
 */
router.get(
  '/',
  // Public endpoint - doctors need to access common symptoms without auth
  async (req: Request, res: Response) => {
    const languageCode = req.query.language as string | undefined;
    const result = await getAllCommonSymptoms(languageCode);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/common-symptoms/{id}:
 *   get:
 *     summary: Get common symptom by ID
 *     tags: [Common Symptoms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Common symptom details
 *       404:
 *         description: Common symptom not found
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response) => {
    const result = await getCommonSymptomById(req.params.id);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/common-symptoms:
 *   post:
 *     summary: Create a new common symptom (admin only)
 *     tags: [Common Symptoms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Common symptom created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Common symptom already exists
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateRequest(createCommonSymptomValidator),
  async (req: Request, res: Response) => {
    const result = await createCommonSymptomService(req.body);
    res.status(201).json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/common-symptoms/{id}:
 *   put:
 *     summary: Update a common symptom (admin only)
 *     tags: [Common Symptoms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Common symptom updated successfully
 *       404:
 *         description: Common symptom not found
 *       409:
 *         description: Common symptom name already exists
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateRequest(updateCommonSymptomValidator),
  async (req: Request, res: Response) => {
    const result = await updateCommonSymptomService(req.params.id, req.body);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/common-symptoms/{id}:
 *   delete:
 *     summary: Delete a common symptom (admin only)
 *     tags: [Common Symptoms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Common symptom deleted successfully
 *       404:
 *         description: Common symptom not found
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    await deleteCommonSymptomService(req.params.id);
    res.json({ success: true, message: 'Common symptom deleted successfully' });
  },
);

export default router;

