import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet } from '@/src/lib/backend-client';
import { ApiResponse, TestResultResponse } from '@/src/types/api.types';

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value;
}

/**
 * GET /api/test-results
 * Get all test results (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const doctorId = searchParams.get('doctorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const queryParams = new URLSearchParams();
    if (city) queryParams.append('city', city);
    if (doctorId) queryParams.append('doctorId', doctorId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (limit) queryParams.append('limit', limit);
    if (offset) queryParams.append('offset', offset);

    // Check if we're using filters (which returns { results, total }) or not (which returns array)
    const hasFilters = city || doctorId || startDate || endDate;
    const response = hasFilters
      ? await backendGet<ApiResponse<{ results: TestResultResponse[]; total: number }>>(
          `/api/test-results${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
          token,
        )
      : await backendGet<ApiResponse<TestResultResponse[]>>(
          `/api/test-results${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
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

