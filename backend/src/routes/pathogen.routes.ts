/**
 * Pathogen routes
 * Handles all pathogen-related endpoints
 */

import { Router, Request, Response } from 'express';
import {
  getAllPathogens,
  getPathogenById,
  createPathogenService,
  updatePathogenService,
  deletePathogenService,
} from '../services/pathogen.service';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createPathogenValidator,
  updatePathogenValidator,
} from '../middleware/validators/pathogen.validators';

const router = Router();

/**
 * @swagger
 * /api/pathogens:
 *   get:
 *     summary: Get all pathogens (public endpoint for doctors)
 *     tags: [Pathogens]
 *     responses:
 *       200:
 *         description: List of pathogens
 */
router.get(
  '/',
  // Public endpoint - doctors need to access pathogens without auth
  async (req: Request, res: Response) => {
    const languageCode = req.query.language as string | undefined;
    const result = await getAllPathogens(languageCode);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/pathogens/{id}:
 *   get:
 *     summary: Get pathogen by ID
 *     tags: [Pathogens]
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
 *         description: Pathogen details
 *       404:
 *         description: Pathogen not found
 */
router.get(
  '/:id',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    const result = await getPathogenById(req.params.id);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/pathogens:
 *   post:
 *     summary: Create a new pathogen (admin only)
 *     tags: [Pathogens]
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
 *         description: Pathogen created successfully
 *       409:
 *         description: Pathogen name already exists
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateRequest(createPathogenValidator),
  async (req: Request, res: Response) => {
    const result = await createPathogenService(req.body);
    res.status(201).json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/pathogens/{id}:
 *   put:
 *     summary: Update a pathogen (admin only)
 *     tags: [Pathogens]
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
 *         description: Pathogen updated successfully
 *       404:
 *         description: Pathogen not found
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateRequest(updatePathogenValidator),
  async (req: Request, res: Response) => {
    const result = await updatePathogenService(req.params.id, req.body);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/pathogens/{id}:
 *   delete:
 *     summary: Delete a pathogen (admin only)
 *     tags: [Pathogens]
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
 *         description: Pathogen deleted successfully
 *       404:
 *         description: Pathogen not found
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    await deletePathogenService(req.params.id);
    res.json({ success: true, message: 'Pathogen deleted successfully' });
  },
);

export default router;

