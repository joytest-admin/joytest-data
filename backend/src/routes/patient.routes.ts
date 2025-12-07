import { Router, Request, Response } from 'express';
import { authenticate, authenticateDoctor, requireAdmin, requireDoctor } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createPatientAdminService,
  createPatientForDoctorService,
  getAllPatientsService,
  getPatientByIdAdminService,
  updatePatientAdminService,
  deletePatientAdminService,
  getDoctorPatientsService,
  getDoctorPatientByIdService,
  updateDoctorPatientService,
  deleteDoctorPatientService,
  searchDoctorPatientsService,
} from '../services/patient.service';
import {
  createPatientAdminValidator,
  createDoctorPatientValidator,
  updatePatientValidator,
  searchPatientsValidator,
} from '../middleware/validators/patient.validators';
import { AuthenticatedRequest } from '../types/auth.types';

const router = Router();

/**
 * Doctor routes - use authenticateDoctor which supports both JWT and link tokens
 */

/**
 * @swagger
 * /api/patients/my/search:
 *   get:
 *     summary: Search patients by identifier or note (doctor only)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         description: Search term to match against identifier or note
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: List of matching patients
 *       400:
 *         description: Bad request (invalid search query)
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my/search',
  authenticateDoctor,
  requireDoctor,
  validateRequest(searchPatientsValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const searchTerm = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const patients = await searchDoctorPatientsService(authReq.user!.userId, searchTerm, limit);
    res.json({ success: true, data: patients });
  },
);

/**
 * @swagger
 * /api/patients/my:
 *   get:
 *     summary: Get all patients for the authenticated doctor
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of patients
 *       401:
 *         description: Unauthorized
 */
router.get('/my', authenticateDoctor, requireDoctor, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const patients = await getDoctorPatientsService(authReq.user!.userId);
  res.json({ success: true, data: patients });
});

/**
 * @swagger
 * /api/patients/my:
 *   post:
 *     summary: Create a new patient (doctor only)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 maxLength: 255
 *               note:
 *                 type: string
 *               yearOfBirth:
 *                 type: integer
 *                 minimum: 1900
 *                 maximum: 2100
 *     responses:
 *       201:
 *         description: Patient created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/my',
  authenticateDoctor,
  requireDoctor,
  validateRequest(createDoctorPatientValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const patient = await createPatientForDoctorService(authReq.user!.userId, req.body);
    res.status(201).json({ success: true, data: patient });
  },
);

/**
 * @swagger
 * /api/patients/my/{id}:
 *   get:
 *     summary: Get patient by ID (doctor only)
 *     tags: [Patients]
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
 *         description: Patient details with associated tests
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (patient does not belong to doctor)
 *       404:
 *         description: Patient not found
 */
router.get('/my/:id', authenticateDoctor, requireDoctor, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const patient = await getDoctorPatientByIdService(authReq.user!.userId, req.params.id);
  res.json({ success: true, data: patient });
});

/**
 * @swagger
 * /api/patients/my/{id}:
 *   put:
 *     summary: Update patient by ID (doctor only)
 *     tags: [Patients]
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
 *               identifier:
 *                 type: string
 *                 maxLength: 255
 *               note:
 *                 type: string
 *                 nullable: true
 *               yearOfBirth:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 1900
 *                 maximum: 2100
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (patient does not belong to doctor)
 *       404:
 *         description: Patient not found
 */
router.put(
  '/my/:id',
  authenticateDoctor,
  requireDoctor,
  validateRequest(updatePatientValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const patient = await updateDoctorPatientService(authReq.user!.userId, req.params.id, req.body);
    res.json({ success: true, data: patient });
  },
);

/**
 * @swagger
 * /api/patients/my/{id}:
 *   delete:
 *     summary: Delete patient by ID (doctor only)
 *     tags: [Patients]
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
 *         description: Patient deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (patient does not belong to doctor)
 *       404:
 *         description: Patient not found
 */
router.delete('/my/:id', authenticateDoctor, requireDoctor, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  await deleteDoctorPatientService(authReq.user!.userId, req.params.id);
  res.json({ success: true, data: { message: 'Patient deleted' } });
});

/**
 * Admin routes - use standard authenticate (JWT only)
 */

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Get all patients (admin only)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all patients
 *       401:
 *         description: Unauthorized
 */
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  const patients = await getAllPatientsService();
  res.json({ success: true, data: patients });
});

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Create a new patient (admin only)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - identifier
 *             properties:
 *               doctorId:
 *                 type: string
 *                 format: uuid
 *               identifier:
 *                 type: string
 *                 maxLength: 255
 *               note:
 *                 type: string
 *               yearOfBirth:
 *                 type: integer
 *                 minimum: 1900
 *                 maximum: 2100
 *     responses:
 *       201:
 *         description: Patient created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  requireAdmin,
  validateRequest(createPatientAdminValidator),
  async (req: Request, res: Response) => {
    const patient = await createPatientAdminService(req.body);
    res.status(201).json({ success: true, data: patient });
  },
);

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Get patient by ID (admin only)
 *     tags: [Patients]
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
 *         description: Patient details with associated tests
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 */
router.get('/:id', requireAdmin, async (req: Request, res: Response) => {
  const patient = await getPatientByIdAdminService(req.params.id);
  res.json({ success: true, data: patient });
});

/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     summary: Update patient by ID (admin only)
 *     tags: [Patients]
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
 *               identifier:
 *                 type: string
 *                 maxLength: 255
 *               note:
 *                 type: string
 *                 nullable: true
 *               yearOfBirth:
 *                 type: integer
 *                 nullable: true
 *                 minimum: 1900
 *                 maximum: 2100
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 */
router.put(
  '/:id',
  requireAdmin,
  validateRequest(updatePatientValidator),
  async (req: Request, res: Response) => {
    const patient = await updatePatientAdminService(req.params.id, req.body);
    res.json({ success: true, data: patient });
  },
);

/**
 * @swagger
 * /api/patients/{id}:
 *   delete:
 *     summary: Delete patient by ID (admin only)
 *     tags: [Patients]
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
 *         description: Patient deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 */
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  await deletePatientAdminService(req.params.id);
  res.json({ success: true, data: { message: 'Patient deleted' } });
});

export default router;

