import { NextRequest, NextResponse } from 'next/server';
import { backendPost } from '@/src/lib/backend-client';
import { ApiResponse, PreregisterRequest, PreregisterResponse } from '@/src/types/api.types';

/**
 * POST /api/auth/preregister
 * Public endpoint to preregister a doctor account
 */
export async function POST(request: NextRequest) {
  try {
    const body: PreregisterRequest = await request.json();

    const response = await backendPost<ApiResponse<PreregisterResponse>>(
      '/api/auth/preregister',
      body,
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to preregister user', statusCode: 500 } },
      { status: 500 },
    );
  }
}

