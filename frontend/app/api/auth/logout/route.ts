import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Logout user by clearing auth token cookie
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth_token');
  return response;
}

