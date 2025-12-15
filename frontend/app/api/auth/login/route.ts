import { NextRequest, NextResponse } from 'next/server';
import { backendPost } from '@/src/lib/backend-client';
import { LoginRequest, AuthResponse, ApiResponse } from '@/src/types/api.types';
import { isUserToken } from '@/src/lib/jwt';

/**
 * POST /api/auth/login
 * Login with email and password
 * Only allows doctor users (role === 'user') to log into doctor portal
 */
export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    
    const response = await backendPost<ApiResponse<AuthResponse>>(
      '/api/auth/login',
      body,
    );

    if (response.success && response.data) {
      // Check if user is a doctor (not admin) before allowing login
      const token = response.data.token;
      if (!isUserToken(token)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'This portal is for doctors only. Please use the admin portal for admin access.',
              statusCode: 403,
            },
          },
          { status: 403 },
        );
      }

      // Set auth token cookie
      const cookieResponse = NextResponse.json(response);
      cookieResponse.cookies.set('auth_token', response.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      
      return cookieResponse;
    }

    return NextResponse.json(
      { success: false, error: { message: 'Login failed', statusCode: 401 } },
      { status: 401 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Login failed', statusCode: 401 } },
      { status: 401 },
    );
  }
}

