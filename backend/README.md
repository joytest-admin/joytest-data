# Backend API

Express.js backend with TypeScript, PostgreSQL, and comprehensive authentication system.

## Architecture

The backend follows a strict layered architecture:

- **Routes** → **Services** → **Queries** → **Database**
- **Middleware**: Authentication, validation, error handling
- **Utils**: Password hashing, JWT, database connection
- **Types**: TypeScript interfaces and types

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Set up environment variables (see `.env.example`)

3. Create the database schema (see `DATABASE_SCHEMA.md`)

4. Run the development server:
```bash
yarn dev
```

5. Access Swagger documentation at `http://localhost:3001/api-docs`

## Environment Variables

Required environment variables:

- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql://user:password@host:port/database`)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT expiration time (default: 7d)
- `SUPERADMIN_TOKEN` - Token for superadmin operations
- `API_URL` - API base URL for Swagger (default: http://localhost:3001)

## API Endpoints

### Authentication

#### Login
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/identify` - Identify user by ICP number
- `POST /api/auth/setup-password` - Setup password for authenticated user (requires Bearer token)

### Admin Management (Superadmin Only)

Requires `x-superadmin-token` header.

- `POST /api/auth/admins` - Create a new admin
- `GET /api/auth/admins` - Get all admins
- `PUT /api/auth/admins/:id` - Update an admin
- `DELETE /api/auth/admins/:id` - Delete an admin

### User Management (Admin Only)

Requires Bearer token with admin role.

- `POST /api/auth/users` - Create a new user
- `GET /api/auth/users` - Get all users
- `PUT /api/auth/users/:id` - Update a user
- `DELETE /api/auth/users/:id` - Delete a user

## Authentication Flow

1. **Admins**: Always require password authentication
   - Created by superadmin via API with `x-superadmin-token`
   - Login with email and password to get JWT token

2. **Users**: Can be identified by ICP number
   - Created by admin
   - Can optionally require password authentication
   - If `requirePassword` is true, user must set password and use bearer auth
   - If `requirePassword` is false, user can be identified by ICP number only

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "statusCode": 400
  }
}
```

## Database Schema

See `DATABASE_SCHEMA.md` for the complete database schema.

