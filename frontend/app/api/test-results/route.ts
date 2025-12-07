import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendPost, backendGet } from '@/src/lib/backend-client';
import { ApiResponse, CreateTestResultRequest, TestResultResponse } from '@/src/types/api.types';

/**
 * GET /api/test-results
 * Get all test results for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    const response = await backendGet<ApiResponse<TestResultResponse[]>>(
      '/api/test-results',
      token,
    );
    
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch test results', statusCode: 500 } },
      { status: 500 },
    );
  }
}

/**
 * POST /api/test-results
 * Create a new test result
 * Can be authenticated by JWT token (Bearer) or unique link token (in body)
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const body: CreateTestResultRequest = await request.json();
    
    // If JWT token exists, use it; otherwise backend will use unique link token from body
    const response = await backendPost<ApiResponse<TestResultResponse>>(
      '/api/test-results',
      body,
      token,
    );
    
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create test result', statusCode: 500 } },
      { status: 500 },
    );
  }
}

