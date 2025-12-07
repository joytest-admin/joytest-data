import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet } from '@/src/lib/backend-client';
import { ApiResponse, Patient } from '@/src/types/api.types';

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

/**
 * GET /api/patients/my/search
 * Search patients by identifier or note
 * Supports both JWT token (from cookie) and link token (from query parameter)
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const jwtToken = cookieStore.get('auth_token')?.value || null;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const limit = searchParams.get('limit');
    const linkToken = searchParams.get('token');

    if (!jwtToken && !linkToken) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    if (!q) {
      return NextResponse.json(
        { success: false, error: { message: 'Search query (q) is required', statusCode: 400 } },
        { status: 400 },
      );
    }

    const queryParams = new URLSearchParams({ q });
    if (limit) {
      queryParams.append('limit', limit);
    }

    const response = await backendGet<ApiResponse<Patient[]>>(
      `/api/patients/my/search?${queryParams.toString()}${linkToken ? `&token=${linkToken}` : ''}`,
      undefined,
      buildHeaders(jwtToken, linkToken),
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to search patients', statusCode: 500 } },
      { status: 500 },
    );
  }
}

