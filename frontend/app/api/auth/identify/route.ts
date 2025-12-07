import { NextRequest, NextResponse } from 'next/server';
import { backendPost } from '@/src/lib/backend-client';
import { IdentifyRequest, ApiResponse, IdentifyResponse } from '@/src/types/api.types';

/**
 * POST /api/auth/identify
 * Identify user by ICP number
 */
export async function POST(request: NextRequest) {
  try {
    const body: IdentifyRequest = await request.json();
    
    const response = await backendPost<ApiResponse<IdentifyResponse>>(
      '/api/auth/identify',
      body,
    );

    if (response.success && response.data) {
      return NextResponse.json(response);
    }

    return NextResponse.json(
      { success: false, error: { message: 'User not found', statusCode: 404 } },
      { status: 404 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Identification failed', statusCode: 404 } },
      { status: 404 },
    );
  }
}

