/**
 * Vaccination routes
 * Handles all vaccination-related endpoints
 */

import { Router, Request, Response } from 'express';
import {
  getAllVaccinations,
  getVaccinationById,
  createVaccinationService,
  updateVaccinationService,
  deleteVaccinationService,
} from '../services/vaccination.service';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createVaccinationValidator,
  updateVaccinationValidator,
} from '../middleware/validators/test.validators';

const router = Router();

/**
 * @swagger
 * /api/vaccinations:
 *   get:
 *     summary: Get all vaccinations (public endpoint)
 *     tags: [Vaccinations]
 *     responses:
 *       200:
 *         description: List of vaccinations
 */
router.get(
  '/',
  // Public endpoint - doctors need to access vaccinations without auth
  async (req: Request, res: Response) => {
    const languageCode = req.query.language as string | undefined;
    const result = await getAllVaccinations(languageCode);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/vaccinations/{id}:
 *   get:
 *     summary: Get vaccination by ID
 *     tags: [Vaccinations]
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
 *         description: Vaccination details
 *       404:
 *         description: Vaccination not found
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response) => {
    const result = await getVaccinationById(req.params.id);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/vaccinations:
 *   post:
 *     summary: Create a new vaccination (admin only)
 *     tags: [Vaccinations]
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
 *         description: Vaccination created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Vaccination already exists
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateRequest(createVaccinationValidator),
  async (req: Request, res: Response) => {
    const result = await createVaccinationService(req.body);
    res.status(201).json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/vaccinations/{id}:
 *   put:
 *     summary: Update a vaccination (admin only)
 *     tags: [Vaccinations]
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
 *         description: Vaccination updated successfully
 *       404:
 *         description: Vaccination not found
 *       409:
 *         description: Vaccination name already exists
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateRequest(updateVaccinationValidator),
  async (req: Request, res: Response) => {
    const result = await updateVaccinationService(req.params.id, req.body);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/vaccinations/{id}:
 *   delete:
 *     summary: Delete a vaccination (admin only)
 *     tags: [Vaccinations]
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
 *         description: Vaccination deleted successfully
 *       404:
 *         description: Vaccination not found
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    await deleteVaccinationService(req.params.id);
    res.json({ success: true, message: 'Vaccination deleted successfully' });
  },
);

export default router;

