/**
 * Next.js API route for getting positive test statistics by pathogens
 * Forwards request to backend API
 * Supports both JWT token (from cookie) and link token (from query parameter)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet } from '@/src/lib/backend-client';
import { ApiResponse } from '@/src/types/api.types';

function buildHeaders(token?: string | null, linkToken?: string | null) {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (linkToken) {
    headers['x-link-token'] = linkToken;
  }
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const jwtToken = cookieStore.get('auth_token')?.value || null;

    const { searchParams } = new URL(request.url);
    const linkToken = searchParams.get('token');
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!jwtToken && !linkToken) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (city) queryParams.append('city', city);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    // Pass token in query string as fallback (middleware checks both header and query param)
    if (linkToken) queryParams.append('token', linkToken);

    const response = await backendGet<ApiResponse<Array<{ pathogenName: string; count: number }>>>(
      `/api/test-results/my/statistics/positive-by-pathogens?${queryParams.toString()}`,
      undefined,
      buildHeaders(jwtToken, linkToken),
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch statistics', statusCode: 500 } },
      { status: 500 },
    );
  }
}

