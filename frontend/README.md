# Frontend - Doctor Test Result Form

This is the frontend application for doctors to input test results. It's built with Next.js 16 (App Router) and TypeScript.

## Features

- **Dual Authentication**:
  - Email/password login (if user has `requirePassword = true`)
  - ICP number identification (for users without password requirement)
  
- **Test Result Form**:
  - All required fields (IČP, test type, result, date of birth, city, test date)
  - Symptoms selection (temperature + common symptoms checkboxes)
  - Optional fields (SARI, ATB, Antivirals, Obesity, Respiratory support, ECMO, Pregnancy)
  - Vaccination selection
  - Additional information textarea

## Requirements

- Node.js >= 20.9.0 (Next.js 16 requirement)
- Yarn package manager

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Create `.env.local` file:
```env
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Run development server:
```bash
yarn dev
```

The application will be available at `http://localhost:3000`.

## Architecture

- **App Router**: Uses Next.js 16 App Router
- **Server Components**: Pages are async server components that fetch data
- **Client Components**: Form components use `'use client'` directive
- **API Routes**: All backend communication goes through Next.js API routes in `app/api/`
- **No Direct Backend Calls**: Client never calls backend directly, all requests go through Next.js API routes

## Environment Variables

- `BACKEND_URL`: URL of the Express backend (e.g., `http://localhost:3001`)
- `NEXT_PUBLIC_APP_URL`: Public URL of this Next.js app (for server-side fetch calls)

## Project Structure

```
frontend/
├── app/
│   ├── api/              # Next.js API routes
│   ├── login/            # Login page
│   ├── page.tsx          # Main form page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── src/
│   ├── components/       # React components
│   ├── lib/              # Utility functions (API clients)
│   └── types/            # TypeScript types
└── public/               # Static assets
```

