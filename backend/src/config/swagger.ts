/**
 * Swagger/OpenAPI configuration
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JoyTest API',
      version: '1.0.0',
      description: 'API documentation for JoyTest application',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        superAdminToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-superadmin-token',
        },
      },
    },
  },
  apis: ['./src/routes/**/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);

