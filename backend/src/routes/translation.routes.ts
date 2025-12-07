/**
 * Translation routes
 * Handles all translation-related endpoints (admin only)
 */

import { Router, Request, Response } from 'express';
import {
  getAllTranslations,
  getTranslationById,
  getTranslationsByEntity,
  createTranslationService,
  updateTranslationService,
  deleteTranslationService,
} from '../services/translation.service';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createTranslationValidator,
  updateTranslationValidator,
  getTranslationsValidator,
  getTranslationsByEntityValidator,
} from '../middleware/validators/translation.validators';
import { TranslationEntityType } from '../types/translation.types';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Translations
 *   description: Translation management for admins
 */

/**
 * @swagger
 * /api/translations:
 *   get:
 *     summary: Get all translations (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [test_type, vaccination, common_symptom, pathogen]
 *         description: Optional filter by entity type
 *     responses:
 *       200:
 *         description: List of translations
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticate,
  requireAdmin,
  validateRequest(getTranslationsValidator),
  async (req: Request, res: Response) => {
    const entityType = req.query.entityType as TranslationEntityType | undefined;
    const languageCode = req.query.languageCode as string | undefined;
    const translations = await getAllTranslations(entityType, languageCode);
    res.json({ success: true, data: translations });
  },
);

/**
 * @swagger
 * /api/translations/{id}:
 *   get:
 *     summary: Get translation by ID (admin only)
 *     tags: [Translations]
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
 *         description: Translation details
 *       404:
 *         description: Translation not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    const translation = await getTranslationById(req.params.id);
    res.json({ success: true, data: translation });
  },
);

/**
 * @swagger
 * /api/translations/entity/{entityType}/{entityId}:
 *   get:
 *     summary: Get translations for a specific entity (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [test_type, vaccination, common_symptom, pathogen]
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of translations for the entity
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/entity/:entityType/:entityId',
  authenticate,
  requireAdmin,
  validateRequest(getTranslationsByEntityValidator),
  async (req: Request, res: Response) => {
    const entityType = req.params.entityType as TranslationEntityType;
    const entityId = req.params.entityId;
    const translations = await getTranslationsByEntity(entityType, entityId);
    res.json({ success: true, data: translations });
  },
);

/**
 * @swagger
 * /api/translations:
 *   post:
 *     summary: Create a new translation (admin only)
 *     tags: [Translations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *               - entityId
 *               - languageCode
 *               - translation
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [test_type, vaccination, common_symptom, pathogen]
 *               entityId:
 *                 type: string
 *                 format: uuid
 *               languageCode:
 *                 type: string
 *                 example: en-US
 *               translation:
 *                 type: string
 *     responses:
 *       201:
 *         description: Translation created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateRequest(createTranslationValidator),
  async (req: Request, res: Response) => {
    const translation = await createTranslationService(req.body);
    res.status(201).json({ success: true, data: translation });
  },
);

/**
 * @swagger
 * /api/translations/{id}:
 *   put:
 *     summary: Update a translation (admin only)
 *     tags: [Translations]
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
 *             required:
 *               - translation
 *             properties:
 *               translation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Translation updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Translation not found
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateRequest(updateTranslationValidator),
  async (req: Request, res: Response) => {
    const translation = await updateTranslationService(req.params.id, req.body);
    res.json({ success: true, data: translation });
  },
);

/**
 * @swagger
 * /api/translations/{id}:
 *   delete:
 *     summary: Delete a translation (admin only)
 *     tags: [Translations]
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
 *         description: Translation deleted successfully
 *       404:
 *         description: Translation not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    await deleteTranslationService(req.params.id);
    res.json({ success: true, message: 'Translation deleted successfully' });
  },
);

export default router;

