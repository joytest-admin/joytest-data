/**
 * Login API route
 * Handles authentication with backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendPost } from '@/src/lib/backend-client';
import { AuthResponse, LoginRequest } from '@/src/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    const response = await backendPost<{ success: boolean; data: AuthResponse }>(
      '/api/auth/login',
      body,
    );

    // Validate response structure
    if (!response.success || !response.data || !response.data.token) {
      throw new Error('Invalid login response: missing token');
    }

    // Set token in cookie
    const token = response.data.token;
    const cookieResponse = NextResponse.json(response);
    
    // Set cookie with proper configuration
    cookieResponse.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/', // Ensure cookie is available for all paths
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[api/auth/login] Cookie set: auth_token=${token ? 'Yes' : 'No'}${token ? ` (${token.substring(0, 20)}...)` : ''}`);
      console.log(`[api/auth/login] Cookie will be sent with path=/`);
    }

    return cookieResponse;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Login failed',
          statusCode: 401,
        },
      },
      { status: 401 },
    );
  }
}

