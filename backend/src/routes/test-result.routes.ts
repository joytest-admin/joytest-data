/**
 * Test result routes
 * Handles all test result-related endpoints
 */

import { Router, Request, Response } from 'express';
import {
  getAllTestResults,
  getTestResultById,
  createTestResultService,
  updateTestResultService,
  deleteTestResultService,
  deleteTestResultAdminService,
  getDoctorTestResults,
  getAdminTestResults,
} from '../services/test-result.service';
import { getPositiveNegativeStatistics, getPositiveByAgeGroupsStatistics, getPositiveByPathogensStatistics, getPositiveTrendsByPathogensStatistics, getPositivePathogenDistributionByScopeStatistics, getPositivePathogensByAgeGroupsStatistics } from '../services/statistics.service';
import { authenticate, authenticateDoctor, requireAdmin, requireDoctor } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createTestResultValidator,
  updateTestResultValidator,
  getDoctorTestResultsValidator,
} from '../middleware/validators/test.validators';
import { AuthenticatedRequest } from '../types/auth.types';
import { extractTokenFromHeader, verifyToken } from '../utils/jwt';
import { findUserByIcpNumber, findUserByUniqueLinkToken } from '../queries/user.queries';
import { UnauthorizedError, BadRequestError } from '../utils/errors';

const router = Router();

/**
 * @swagger
 * /api/test-results:
 *   get:
 *     summary: Get all test results
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of test results
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    
    // If admin, always use paginated endpoint (with or without filters)
    if (authReq.user?.role === 'admin') {
      const city = req.query.city as string | undefined;
      const doctorId = req.query.doctorId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      // Always use the paginated admin endpoint
      const result = await getAdminTestResults({
        city,
        doctorId,
        startDate,
        endDate,
        limit,
        offset,
      });
      return res.json({ success: true, data: result });
    }

    // Default behavior: doctors see only their results, admins see all (with optional pagination)
    const userId = authReq.user?.role === 'user' ? authReq.user.userId : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

    const result = await getAllTestResults(userId, limit, offset);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-results/my:
 *   get:
 *     summary: Get test results for the authenticated doctor with search, sorting, and pagination
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to match against city, test type, pathogen, patient identifier, or ICP number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, date_of_birth, city, test_type_name, pathogen_name, patient_identifier]
 *         description: Field to sort by (default: created_at)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (default: desc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page (default: 20)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Number of results to skip (default: 0)
 *     responses:
 *       200:
 *         description: Test results with pagination info
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
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TestResultResponse'
 *                     total:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my',
  authenticateDoctor,
  requireDoctor,
  validateRequest(getDoctorTestResultsValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const search = req.query.search as string | undefined;
    const city = req.query.city as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const sortBy = req.query.sortBy as 'created_at' | 'date_of_birth' | 'city' | 'test_type_name' | 'pathogen_name' | 'patient_identifier' | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await getDoctorTestResults(authReq.user.userId, {
      search,
      city,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      limit,
      offset,
    });

    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-results/my/statistics/positive-negative:
 *   get:
 *     summary: Get positive and negative test result statistics for the authenticated doctor
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to match against city, test type, pathogen, patient identifier, or ICP number
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city (partial match)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Statistics with positive and negative counts
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
 *                     positive:
 *                       type: integer
 *                       description: Number of positive test results (pathogen_id IS NOT NULL)
 *                     negative:
 *                       type: integer
 *                       description: Number of negative test results (pathogen_id IS NULL)
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request (invalid date format or range)
 */
router.get(
  '/my/statistics/positive-negative',
  authenticateDoctor,
  requireDoctor,
  validateRequest(getDoctorTestResultsValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const search = req.query.search as string | undefined;
    const city = req.query.city as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const result = await getPositiveNegativeStatistics(authReq.user.userId, {
      search,
      city,
      startDate,
      endDate,
    });

    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-results/my/statistics/positive-by-age-groups:
 *   get:
 *     summary: Get positive test result statistics by age groups for the authenticated doctor
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to match against city, test type, pathogen, patient identifier, or ICP number
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city (partial match)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Statistics with positive test counts by age groups
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
 *                     age0to5:
 *                       type: integer
 *                       description: Number of positive tests for age 0-5
 *                     age6to14:
 *                       type: integer
 *                       description: Number of positive tests for age 6-14
 *                     age15to24:
 *                       type: integer
 *                       description: Number of positive tests for age 15-24
 *                     age25to64:
 *                       type: integer
 *                       description: Number of positive tests for age 25-64
 *                     age65plus:
 *                       type: integer
 *                       description: Number of positive tests for age 65+
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request (invalid date format or range)
 */
router.get(
  '/my/statistics/positive-by-age-groups',
  authenticateDoctor,
  requireDoctor,
  validateRequest(getDoctorTestResultsValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const search = req.query.search as string | undefined;
    const city = req.query.city as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const result = await getPositiveByAgeGroupsStatistics(authReq.user.userId, {
      search,
      city,
      startDate,
      endDate,
    });

    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-results/my/statistics/positive-by-pathogens:
 *   get:
 *     summary: Get positive test result statistics grouped by pathogen for the authenticated doctor
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to match against city, test type, pathogen, patient identifier, or ICP number
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city (partial match)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Statistics with positive test counts grouped by pathogen
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       pathogenName:
 *                         type: string
 *                         description: Name of the pathogen
 *                       count:
 *                         type: integer
 *                         description: Number of positive tests for this pathogen
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request (invalid date format or range)
 */
router.get(
  '/my/statistics/positive-by-pathogens',
  authenticateDoctor,
  requireDoctor,
  validateRequest(getDoctorTestResultsValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const search = req.query.search as string | undefined;
    const city = req.query.city as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const result = await getPositiveByPathogensStatistics(authReq.user.userId, {
      search,
      city,
      startDate,
      endDate,
    });

    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-results/my/statistics/positive-trends-by-pathogens:
 *   get:
 *     summary: Get positive test result trends over time grouped by pathogen for the authenticated doctor
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to match against city, test type, pathogen, patient identifier, or ICP number
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city (partial match)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (ISO 8601 format)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *         description: Time period for grouping (default: day)
 *       - in: query
 *         name: allDoctors
 *         schema:
 *           type: boolean
 *         description: If true, show data for all doctors; if false, show only current doctor's data (default: false)
 *       - in: query
 *         name: regionId
 *         schema:
 *           type: integer
 *         description: Filter by region ID (optional)
 *       - in: query
 *         name: cityId
 *         schema:
 *           type: integer
 *         description: Filter by city ID (optional)
 *     responses:
 *       200:
 *         description: Statistics with positive test trends by pathogen and total
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
 *                     byPathogen:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           pathogenName:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     total:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           count:
 *                             type: integer
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request (invalid date format or range)
 */
router.get(
  '/my/statistics/positive-trends-by-pathogens',
  authenticateDoctor,
  requireDoctor,
  validateRequest(getDoctorTestResultsValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const search = req.query.search as string | undefined;
    const city = req.query.city as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const period = (req.query.period as 'day' | 'week' | 'month' | undefined) || 'day';
    const allDoctors = req.query.allDoctors === 'true' || req.query.allDoctors === '1';
    const regionId = req.query.regionId ? parseInt(req.query.regionId as string, 10) : undefined;
    const cityId = req.query.cityId ? parseInt(req.query.cityId as string, 10) : undefined;

    // Determine doctorId: null if allDoctors is true, otherwise use current user's ID
    const doctorId = allDoctors ? null : authReq.user.userId;

    const result = await getPositiveTrendsByPathogensStatistics(doctorId, {
      search,
      city,
      regionId,
      cityId,
      startDate,
      endDate,
      period,
    });

    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-results/my/statistics/pathogens-by-age-groups:
 *   get:
 *     summary: Get positive pathogens by age groups (all doctors)
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: City name filter
 *       - in: query
 *         name: regionId
 *         schema:
 *           type: integer
 *         description: Filter by region ID
 *       - in: query
 *         name: cityId
 *         schema:
 *           type: integer
 *         description: Filter by city ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Pathogens by age groups statistics
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my/statistics/pathogens-by-age-groups',
  authenticateDoctor,
  requireDoctor,
  validateRequest(getDoctorTestResultsValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const search = req.query.search as string | undefined;
    const city = req.query.city as string | undefined;
    const regionId = req.query.regionId ? parseInt(req.query.regionId as string, 10) : undefined;
    const cityId = req.query.cityId ? parseInt(req.query.cityId as string, 10) : undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // Always use null for doctorId to get all doctors' data
    const result = await getPositivePathogensByAgeGroupsStatistics(null, {
      search,
      city,
      regionId,
      cityId,
      startDate,
      endDate,
    });

    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-results/my/statistics/pathogen-distribution-by-scope:
 *   get:
 *     summary: Get positive pathogen distribution by scope (Me, District, Region, Country) for the authenticated doctor
 *     tags: [Test Results]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Pathogen distribution by scope
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
 *                     me:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           pathogenName:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           percentage:
 *                             type: number
 *                     district:
 *                       type: array
 *                       items:
 *                         type: object
 *                     region:
 *                       type: array
 *                       items:
 *                         type: object
 *                     country:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my/statistics/pathogen-distribution-by-scope',
  authenticateDoctor,
  requireDoctor,
  validateRequest(getDoctorTestResultsValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const regionId = req.query.regionId ? parseInt(req.query.regionId as string, 10) : undefined;
    const cityId = req.query.cityId ? parseInt(req.query.cityId as string, 10) : undefined;

    const result = await getPositivePathogenDistributionByScopeStatistics(authReq.user.userId, {
      startDate,
      endDate,
      regionId,
      cityId,
    });

    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-results/{id}:
 *   get:
 *     summary: Get test result by ID
 *     tags: [Test Results]
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
 *         description: Test result details
 *       403:
 *         description: Forbidden (doctors can only access their own results)
 *       404:
 *         description: Test result not found
 */
router.get(
  '/:id',
  authenticateDoctor,
  requireDoctor,
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const result = await getTestResultById(req.params.id, authReq.user.userId);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-results:
 *   post:
 *     summary: Create a new test result (doctor/user only)
 *     description: Can be authenticated via Bearer token OR via unique link token (if user doesn't require password)
 *     tags: [Test Results]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - city
 *               - testTypeId
 *               - dateOfBirth
 *               - symptoms
 *             properties:
 *               city:
 *                 type: string
 *               testTypeId:
 *                 type: string
 *                 format: uuid
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *               otherInformations:
 *                 type: string
 *               sari:
 *                 type: boolean
 *               atb:
 *                 type: boolean
 *               antivirals:
 *                 type: boolean
 *               obesity:
 *                 type: boolean
 *               respiratorySupport:
 *                 type: boolean
 *               ecmo:
 *                 type: boolean
 *               pregnancy:
 *                 type: boolean
 *               vaccinationId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Test result created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  validateRequest(createTestResultValidator),
  async (req: Request, res: Response) => {
    let userId: string;

    // Try to authenticate via JWT Bearer token first
    const jwtToken = extractTokenFromHeader(req.headers.authorization);
    if (jwtToken) {
      const payload = verifyToken(jwtToken);
      if (payload) {
        userId = payload.userId;
      } else {
        return res.status(401).json({ success: false, error: { message: 'Invalid or expired token' } });
      }
    } else {
      // No JWT token provided - try unique link token authentication
      // Token can come from query parameter (for GET-like requests) or body
      const linkToken = req.query.token as string || req.body.token as string;
      if (!linkToken) {
        return res.status(400).json({ success: false, error: { message: 'Authentication required: provide Bearer token or unique link token' } });
      }

      // Find user by unique link token
      const user = await findUserByUniqueLinkToken(linkToken);
      if (!user) {
        return res.status(404).json({ success: false, error: { message: 'Uživatel s tímto tokenem nebyl nalezen' } });
      }

      // Check if user is approved
      if (user.status !== 'approved') {
        return res.status(403).json({ success: false, error: { message: 'Váš účet čeká na schválení nebo byl zamítnut' } });
      }

      // Check if user requires password (if yes, they must use JWT token auth)
      if (user.requirePassword) {
        return res.status(401).json({ success: false, error: { message: 'Tento uživatel vyžaduje přihlášení pomocí hesla' } });
      }

      userId = user.id;
    }

    const result = await createTestResultService(req.body, userId);
    res.status(201).json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-results/{id}:
 *   put:
 *     summary: Update a test result (doctor/user only)
 *     tags: [Test Results]
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
 *               city:
 *                 type: string
 *               icpNumber:
 *                 type: string
 *               testTypeId:
 *                 type: string
 *                 format: uuid
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *               otherInformations:
 *                 type: string
 *               sari:
 *                 type: boolean
 *               atb:
 *                 type: boolean
 *               antivirals:
 *                 type: boolean
 *               obesity:
 *                 type: boolean
 *               respiratorySupport:
 *                 type: boolean
 *               ecmo:
 *                 type: boolean
 *               pregnancy:
 *                 type: boolean
 *               vaccinationId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Test result updated successfully
 *       403:
 *         description: Forbidden (doctors can only update their own results)
 *       404:
 *         description: Test result not found
 */
router.put(
  '/:id',
  authenticateDoctor,
  requireDoctor,
  validateRequest(updateTestResultValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const result = await updateTestResultService(req.params.id, req.body, authReq.user.userId);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/test-results/{id}:
 *   delete:
 *     summary: Delete a test result (doctor/user only)
 *     tags: [Test Results]
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
 *         description: Test result deleted successfully
 *       403:
 *         description: Forbidden (doctors can only delete their own results)
 *       404:
 *         description: Test result not found
 */
router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    await deleteTestResultService(req.params.id, authReq.user.userId);
    res.json({ success: true, message: 'Test result deleted successfully' });
  },
);

/**
 * @swagger
 * /api/test-results/{id}/admin:
 *   delete:
 *     summary: Delete a test result (admin only)
 *     tags: [Test Results]
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
 *         description: Test result deleted successfully
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Test result not found
 */
router.delete(
  '/:id/admin',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response) => {
    await deleteTestResultAdminService(req.params.id);
    res.json({ success: true, message: 'Test result deleted successfully' });
  },
);

export default router;

