/**
 * Export routes
 * Handles CSV export endpoints for test results
 */

import { Router, Request, Response } from 'express';
import { authenticateDoctor, requireDoctor, authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  exportByIntervalValidator,
  exportByPatientValidator,
  adminExportValidator,
} from '../middleware/validators/export.validators';
import {
  getDoctorTestResultsByInterval,
  getDoctorTestResultsByPatient,
  getAdminTestResultsForExport,
} from '../services/test-result.service';
import { generateTestResultsCsv, generateCsvFilename } from '../utils/csv-export';
import { AuthenticatedRequest } from '../types/auth.types';
import { BadRequestError } from '../utils/errors';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Exports
 *   description: CSV export endpoints for test results
 */

/**
 * @swagger
 * /api/exports/test-results/by-interval:
 *   get:
 *     summary: Export test results by time interval (doctor only)
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (ISO 8601 format)
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Bad request (invalid dates)
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/test-results/by-interval',
  authenticateDoctor,
  requireDoctor,
  validateRequest(exportByIntervalValidator),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const city = req.query.city as string | undefined;

      const results = await getDoctorTestResultsByInterval(
        authReq.user.userId,
        startDate,
        endDate,
        city,
      );

      const csv = generateTestResultsCsv(results);
      const filename = generateCsvFilename('interval', { startDate, endDate });

      // Add BOM for Excel compatibility and set headers for CSV download
      const csvWithBom = '\ufeff' + csv;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(csvWithBom, 'utf8'));

      res.send(csvWithBom);
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ success: false, error: { message: error.message } });
      }
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to export test results' },
      });
    }
  },
);

/**
 * @swagger
 * /api/exports/test-results/by-patient:
 *   get:
 *     summary: Export test results by patient (doctor only)
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Bad request (invalid patient ID)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 */
router.get(
  '/test-results/by-patient',
  authenticateDoctor,
  requireDoctor,
  validateRequest(exportByPatientValidator),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const patientId = req.query.patientId as string;

      const results = await getDoctorTestResultsByPatient(authReq.user.userId, patientId);

      // Get patient identifier for filename
      const patientIdentifier = results.length > 0 ? results[0].patientIdentifier : 'unknown';

      const csv = generateTestResultsCsv(results);
      const filename = generateCsvFilename('patient', { patientIdentifier: patientIdentifier || undefined });

      // Add BOM for Excel compatibility and set headers for CSV download
      const csvWithBom = '\ufeff' + csv;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(csvWithBom, 'utf8'));

      res.send(csvWithBom);
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ success: false, error: { message: error.message } });
      }
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to export test results' },
      });
    }
  },
);

/**
 * Admin routes - use standard authenticate (JWT only)
 */

/**
 * @swagger
 * /api/exports/test-results/admin:
 *   get:
 *     summary: Export test results with filters (admin only)
 *     tags: [Exports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city (partial match)
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by doctor ID
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
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Bad request (invalid parameters)
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/test-results/admin',
  authenticate,
  requireAdmin,
  validateRequest(adminExportValidator),
  async (req: Request, res: Response) => {
    try {
      const city = req.query.city as string | undefined;
      const doctorId = req.query.doctorId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const results = await getAdminTestResultsForExport({
        city,
        doctorId,
        startDate,
        endDate,
      });

      const csv = generateTestResultsCsv(results);
      
      // Generate filename based on filters
      let filename = 'test-results';
      if (startDate && endDate) {
        const start = startDate.split('T')[0];
        const end = endDate.split('T')[0];
        filename = `test-results-${start}-to-${end}`;
      } else {
        filename = `test-results-${new Date().toISOString().split('T')[0]}`;
      }
      if (city) {
        const safeCity = city.replace(/[^a-zA-Z0-9-_]/g, '_');
        filename += `-${safeCity}`;
      }
      if (doctorId) {
        filename += `-doctor-${doctorId.substring(0, 8)}`;
      }
      filename += '.csv';

      // Add BOM for Excel compatibility and set headers for CSV download
      const csvWithBom = '\ufeff' + csv;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(csvWithBom, 'utf8'));

      res.send(csvWithBom);
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ success: false, error: { message: error.message } });
      }
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to export test results' },
      });
    }
  },
);

export default router;

