/**
 * Geography routes
 * Handles all geography-related endpoints for Czech address hierarchy
 */

import { Router, Request, Response } from 'express';
import {
  getAllRegions,
  getAllDistricts,
  getAllCities,
  getRegionById,
  getDistrictById,
  getCityById,
} from '../services/geography.service';

const router = Router();

/**
 * @swagger
 * /api/geography/regions:
 *   get:
 *     summary: Get all regions (public endpoint)
 *     tags: [Geography]
 *     description: Returns a list of all Czech regions (kraje), optionally filtered by search term
 *     parameters:
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Search term to filter regions by name (case-insensitive partial match)
 *     responses:
 *       200:
 *         description: List of regions
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
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get(
  '/regions',
  // Public endpoint - doctors need to access geography data without auth
  async (req: Request, res: Response) => {
    const search = req.query.q as string | undefined;
    const result = await getAllRegions(search);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/geography/districts:
 *   get:
 *     summary: Get all districts, optionally filtered by region (public endpoint)
 *     tags: [Geography]
 *     description: Returns a list of Czech districts (okresy), optionally filtered by region ID and search term
 *     parameters:
 *       - in: query
 *         name: regionId
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filter districts by region ID
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Search term to filter districts by name (case-insensitive partial match)
 *     responses:
 *       200:
 *         description: List of districts
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
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       regionId:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get(
  '/districts',
  // Public endpoint - doctors need to access geography data without auth
  async (req: Request, res: Response) => {
    const regionId = req.query.regionId
      ? parseInt(req.query.regionId as string, 10)
      : undefined;
    const search = req.query.q as string | undefined;

    // Validate regionId if provided
    if (regionId !== undefined && isNaN(regionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid regionId parameter. Must be a number.',
      });
    }

    const result = await getAllDistricts(regionId, search);
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/geography/cities:
 *   get:
 *     summary: Get all cities, optionally filtered by district (public endpoint)
 *     tags: [Geography]
 *     description: Returns a list of Czech cities (města), optionally filtered by district ID and search term
 *     parameters:
 *       - in: query
 *         name: districtId
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filter cities by district ID
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Search term to filter cities by name (case-insensitive partial match)
 *     responses:
 *       200:
 *         description: List of cities
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
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       districtId:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 */
router.get(
  '/cities',
  // Public endpoint - doctors need to access geography data without auth
  async (req: Request, res: Response) => {
    const districtId = req.query.districtId
      ? parseInt(req.query.districtId as string, 10)
      : undefined;
    const search = req.query.q as string | undefined;

    // Validate districtId if provided
    if (districtId !== undefined && isNaN(districtId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid districtId parameter. Must be a number.',
      });
    }

    const result = await getAllCities(districtId, search);
    res.json({ success: true, data: result });
  },
);


/**
 * @swagger
 * /api/geography/regions/{id}:
 *   get:
 *     summary: Get region by ID (public endpoint)
 *     tags: [Geography]
 *     description: Returns a single region by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Region ID
 *     responses:
 *       200:
 *         description: Region details
 *       404:
 *         description: Region not found
 */
router.get(
  '/regions/:id',
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid region ID. Must be a number.',
      });
    }
    const result = await getRegionById(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Region not found',
      });
    }
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/geography/districts/{id}:
 *   get:
 *     summary: Get district by ID (public endpoint)
 *     tags: [Geography]
 *     description: Returns a single district by ID with parent region
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: District ID
 *     responses:
 *       200:
 *         description: District details
 *       404:
 *         description: District not found
 */
router.get(
  '/districts/:id',
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid district ID. Must be a number.',
      });
    }
    const result = await getDistrictById(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'District not found',
      });
    }
    res.json({ success: true, data: result });
  },
);

/**
 * @swagger
 * /api/geography/cities/{id}:
 *   get:
 *     summary: Get city by ID (public endpoint)
 *     tags: [Geography]
 *     description: Returns a single city by ID with parent district and region
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: City ID
 *     responses:
 *       200:
 *         description: City details
 *       404:
 *         description: City not found
 */
router.get(
  '/cities/:id',
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid city ID. Must be a number.',
      });
    }
    const result = await getCityById(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'City not found',
      });
    }
    res.json({ success: true, data: result });
  },
);

export default router;

