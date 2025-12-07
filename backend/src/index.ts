/**
 * Main application entry point
 * Sets up Express server with all routes, middleware, and Swagger documentation
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import testTypeRoutes from './routes/test-type.routes';
import translationRoutes from './routes/translation.routes';
import vaccinationRoutes from './routes/vaccination.routes';
import testResultRoutes from './routes/test-result.routes';
import commonSymptomRoutes from './routes/common-symptom.routes';
import pathogenRoutes from './routes/pathogen.routes';
import patientRoutes from './routes/patient.routes';
import feedbackRoutes from './routes/feedback.routes';
import exportRoutes from './routes/export.routes';
import geographyRoutes from './routes/geography.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { closeDatabasePool } from './utils/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the API', docs: '/api-docs' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/test-types', testTypeRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/vaccinations', vaccinationRoutes);
app.use('/api/test-results', testResultRoutes);
app.use('/api/common-symptoms', commonSymptomRoutes);
app.use('/api/pathogens', pathogenRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/geography', geographyRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await closeDatabasePool();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await closeDatabasePool();
    process.exit(0);
  });
});
