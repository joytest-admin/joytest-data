/**
 * Authentication routes
 * Handles all authentication-related endpoints
 */

import { Router, Request, Response } from 'express';
import {
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getAllAdmins,
  createRegularUser,
  updateRegularUser,
  deleteRegularUser,
  getAllUsers,
  getPendingUsers,
  setupUserPassword,
  login,
  identifyByIcp,
  identifyByToken,
  regenerateUserToken,
  preregisterUser,
  validateUser,
  getDoctorProfile,
  updateDoctorProfile,
} from '../services/auth.service';
import { authenticate, requireAdmin, requireSuperAdmin } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createAdminValidator,
  updateAdminValidator,
  createUserValidator,
  updateUserValidator,
  setupUserPasswordValidator,
  loginValidator,
  identifyByIcpValidator,
  identifyByTokenValidator,
  preregisterValidator,
  validateUserValidator,
  updateDoctorProfileValidator,
} from '../middleware/validators/auth.validators';
import { AuthenticatedRequest } from '../types/auth.types';
import { extractTokenFromHeader, verifyToken } from '../utils/jwt';

const resolveDoctorUserId = async (req: Request): Promise<string | null> => {
  const bearer = extractTokenFromHeader(req.headers.authorization);
  if (bearer) {
    const payload = verifyToken(bearer);
    if (!payload) {
      return null;
    }
    return payload.userId;
  }

  const linkToken =
    (req.headers['x-link-token'] as string) ||
    (req.query.token as string | undefined);

  if (linkToken) {
    const user = await identifyByToken({ token: linkToken });
    return user.id;
  }

  return null;
};

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  validateRequest(loginValidator),
  async (req: Request, res: Response) => {
    const result = await login(req.body);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/auth/identify:
 *   post:
 *     summary: Identify user by ICP number
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - icpNumber
 *             properties:
 *               icpNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: User identified successfully
 *       404:
 *         description: User not found
 */
router.post(
  '/identify',
  validateRequest(identifyByIcpValidator),
  async (req: Request, res: Response) => {
    const result = await identifyByIcp(req.body);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/auth/identify-by-token:
 *   post:
 *     summary: Identify user by unique link token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: User identified successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: User requires password authentication
 */
router.post(
  '/identify-by-token',
  validateRequest(identifyByTokenValidator),
  async (req: Request, res: Response) => {
    const result = await identifyByToken(req.body);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/auth/preregister:
 *   post:
 *     summary: Preregister a new user (public, no auth required)
 *     description: Creates a user account with 'pending' status awaiting admin approval
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - icpNumber
 *               - requirePassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               icpNumber:
 *                 type: string
 *               requirePassword:
 *                 type: boolean
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: User preregistered successfully (pending approval)
 *       400:
 *         description: Bad request
 *       409:
 *         description: Email or ICP number already exists
 */
router.post(
  '/preregister',
  validateRequest(preregisterValidator),
  async (req: Request, res: Response) => {
    const result = await preregisterUser(req.body);
    res.status(201).json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/auth/setup-password:
 *   post:
 *     summary: Setup password for authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password set up successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/setup-password',
  authenticate,
  validateRequest(setupUserPasswordValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }
    const result = await setupUserPassword(authReq.user.userId, req.body);
    res.json({ success: true, data: result });
  },
);

// ==================== Superadmin Routes (Admin Management) ====================

/**
 * @swagger
 * /api/auth/admins:
 *   post:
 *     summary: Create a new admin (superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - superAdminToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       409:
 *         description: Email already exists
 */
router.post(
  '/admins',
  requireSuperAdmin,
  validateRequest(createAdminValidator),
  async (req: Request, res: Response) => {
    const result = await createAdmin(req.body);
    res.status(201).json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/auth/admins:
 *   get:
 *     summary: Get all admins (superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - superAdminToken: []
 *     responses:
 *       200:
 *         description: List of admins
 */
router.get(
  '/admins',
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    const result = await getAllAdmins();
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/auth/admins/{id}:
 *   put:
 *     summary: Update an admin (superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - superAdminToken: []
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
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       404:
 *         description: Admin not found
 */
router.put(
  '/admins/:id',
  requireSuperAdmin,
  validateRequest(updateAdminValidator),
  async (req: Request, res: Response) => {
    const result = await updateAdmin(req.params.id, req.body);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/auth/admins/{id}:
 *   delete:
 *     summary: Delete an admin (superadmin only)
 *     tags: [Admin Management]
 *     security:
 *       - superAdminToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *       404:
 *         description: Admin not found
 */
router.delete(
  '/admins/:id',
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    await deleteAdmin(req.params.id);
    res.json({ success: true, message: 'Admin deleted successfully' });
  },
);

// ==================== Admin Routes (User Management) ====================

/**
 * @swagger
 * /api/auth/users:
 *   post:
 *     summary: Create a new user (admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - icpNumber
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               icpNumber:
 *                 type: string
 *               requirePassword:
 *                 type: boolean
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: User created successfully
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Email or ICP number already exists
 */
router.post(
  '/users',
  authenticate,
  requireAdmin,
  validateRequest(createUserValidator),
  async (req: Request, res: Response) => {
    const result = await createRegularUser(req.body);
    res.status(201).json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/auth/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/users',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    const result = await getAllUsers();
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/auth/users/pending:
 *   get:
 *     summary: Get all pending users (admin only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending users
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/users/pending',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    const result = await getPendingUsers();
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   put:
 *     summary: Update a user (admin only)
 *     tags: [User Management]
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
 *               email:
 *                 type: string
 *                 format: email
 *               icpNumber:
 *                 type: string
 *               requirePassword:
 *                 type: boolean
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put(
  '/users/:id',
  authenticate,
  requireAdmin,
  validateRequest(updateUserValidator),
  async (req: Request, res: Response) => {
    const result = await updateRegularUser(req.params.id, req.body);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/auth/users/{id}:
 *   delete:
 *     summary: Delete a user (admin only)
 *     tags: [User Management]
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
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete(
  '/users/:id',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    await deleteRegularUser(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  },
);

/**
 * @swagger
 * /api/auth/users/{id}/regenerate-token:
 *   post:
 *     summary: Regenerate unique link token for a user (admin only)
 *     tags: [User Management]
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
 *         description: Token regenerated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post(
  '/users/:id/regenerate-token',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    const result = await regenerateUserToken(req.params.id);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/auth/users/{id}/validate:
 *   post:
 *     summary: Validate (approve or reject) a preregistered user (admin only)
 *     tags: [User Management]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *     responses:
 *       200:
 *         description: User validated successfully
 *       400:
 *         description: Bad request (user not pending or invalid status)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post(
  '/users/:id/validate',
  authenticate,
  requireAdmin,
  validateRequest(validateUserValidator),
  async (req: Request, res: Response) => {
    const result = await validateUser(req.params.id, req.body);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get doctor profile (self-service)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       401:
 *         description: Unauthorized
 *
 *   put:
 *   put:
 *     summary: Update doctor profile (self-service)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               requirePassword:
 *                 type: boolean
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/profile',
  validateRequest(updateDoctorProfileValidator),
  async (req: Request, res: Response) => {
    try {
      const doctorId = await resolveDoctorUserId(req);
      if (!doctorId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }
      const result = await updateDoctorProfile(doctorId, req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to update profile' },
      });
    }
  },
);

router.get(
  '/profile',
  async (req: Request, res: Response) => {
    try {
      const doctorId = await resolveDoctorUserId(req);
      if (!doctorId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }
      const result = await getDoctorProfile(doctorId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: { message: error.message || 'Failed to fetch profile' },
      });
    }
  },
);

export default router;

