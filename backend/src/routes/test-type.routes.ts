/**
 * Test type routes
 * Handles all test type-related endpoints
 */

import { Router, Request, Response } from 'express';
import {
  getAllTestTypes,
  getTestTypeById,
  createTestTypeService,
  updateTestTypeService,
  deleteTestTypeService,
} from '../services/test-type.service';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createTestTypeValidator,
  updateTestTypeValidator,
} from '../middleware/validators/test.validators';

const router = Router();

/**
 * @swagger
 * /api/test-types:
 *   get:
 *     summary: Get all test types (public endpoint)
 *     tags: [Test Types]
 *     responses:
 *       200:
 *         description: List of test types
 */
router.get(
  '/',
  // Public endpoint - doctors need to access test types without auth
  async (req: Request, res: Response) => {
    const languageCode = req.query.language as string | undefined;
    const result = await getAllTestTypes(languageCode);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-types/{id}:
 *   get:
 *     summary: Get test type by ID
 *     tags: [Test Types]
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
 *         description: Test type details
 *       404:
 *         description: Test type not found
 */
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response) => {
    const result = await getTestTypeById(req.params.id);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-types:
 *   post:
 *     summary: Create a new test type (admin only)
 *     tags: [Test Types]
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
 *         description: Test type created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Test type already exists
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateRequest(createTestTypeValidator),
  async (req: Request, res: Response) => {
    const result = await createTestTypeService(req.body);
    res.status(201).json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-types/{id}:
 *   put:
 *     summary: Update a test type (admin only)
 *     tags: [Test Types]
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
 *         description: Test type updated successfully
 *       404:
 *         description: Test type not found
 *       409:
 *         description: Test type name already exists
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateRequest(updateTestTypeValidator),
  async (req: Request, res: Response) => {
    const result = await updateTestTypeService(req.params.id, req.body);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-types/{id}:
 *   delete:
 *     summary: Delete a test type (admin only)
 *     tags: [Test Types]
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
 *         description: Test type deleted successfully
 *       404:
 *         description: Test type not found
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    await deleteTestTypeService(req.params.id);
    res.json({ success: true, message: 'Test type deleted successfully' });
  },
);

export default router;

