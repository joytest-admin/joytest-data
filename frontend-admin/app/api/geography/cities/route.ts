import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet } from '@/src/lib/backend-client';
import { ApiResponse, CityResponse } from '@/src/types/api.types';

/**
 * GET /api/geography/cities
 * Get all cities, optionally filtered by district or search query
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

    const { searchParams } = new URL(request.url);
    const districtId = searchParams.get('districtId');
    const search = searchParams.get('q');

    const params = new URLSearchParams();
    if (districtId) {
      params.append('districtId', districtId);
    }
    if (search) {
      params.append('q', search);
    }
    const query = params.toString() ? `?${params.toString()}` : '';

    const response = await backendGet<ApiResponse<CityResponse[]>>(
      `/api/geography/cities${query}`,
      token,
    );
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch cities', statusCode: 500 } },
      { status: 500 },
    );
  }
}

