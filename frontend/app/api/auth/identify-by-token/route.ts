import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendPost } from '@/src/lib/backend-client';
import { ApiResponse, IdentifyResponse, IdentifyByTokenRequest } from '@/src/types/api.types';

/**
 * POST /api/auth/identify-by-token
 * Identify user by unique link token
 */
export async function POST(request: NextRequest) {
  try {
    const body: IdentifyByTokenRequest = await request.json();
    
    const response = await backendPost<ApiResponse<IdentifyResponse>>(
      '/api/auth/identify-by-token',
      body,
    );
    
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to identify user', statusCode: 500 } },
      { status: 500 },
    );
  }
}

