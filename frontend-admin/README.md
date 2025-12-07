# JOY MED Admin Portal

Next.js admin portal for managing test results, test types, vaccinations, and doctors.

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Set up environment variables:
Create a `.env.local` file with:
```
BACKEND_URL=http://localhost:3001
```

Note: `BACKEND_URL` is server-side only (not prefixed with `NEXT_PUBLIC_`) since it's only used in Next.js API routes, not in client components.

3. Run the development server:
```bash
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Architecture

- **Pages**: Server components that fetch data and pass to client components
- **API Routes**: Next.js API routes in `app/api` that communicate with the backend
- **Components**: Client components for interactive UI
- **No direct client-to-backend communication**: All requests go through Next.js API routes

## Pages

- `/login` - Login page
- `/dashboard` - Main dashboard (to be implemented)
- `/doctors` - Doctor management (to be implemented)
- `/tests` - Test results management (to be implemented)
- `/test-types` - Test types management
- `/vaccinations` - Vaccinations management

## Features

- Authentication with JWT tokens stored in HTTP-only cookies
- Protected routes with automatic redirect to login
- CRUD operations for test types and vaccinations
- Responsive design with Tailwind CSS
