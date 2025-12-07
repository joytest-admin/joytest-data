import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet, backendPut } from '@/src/lib/backend-client';
import {
  ApiResponse,
  DoctorProfileResponse,
  UpdateDoctorProfileRequest,
} from '@/src/types/api.types';

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
 * GET /api/auth/profile
 * Fetch doctor profile (supports JWT or link token)
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const jwtToken = cookieStore.get('auth_token')?.value || null;
  const linkToken = request.nextUrl.searchParams.get('token');

  if (!jwtToken && !linkToken) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
      { status: 401 },
    );
  }

  try {
    const response = await backendGet<ApiResponse<DoctorProfileResponse>>(
      `/api/auth/profile${linkToken ? `?token=${linkToken}` : ''}`,
      undefined,
      buildHeaders(jwtToken, linkToken),
    );
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to load profile', statusCode: 500 } },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/auth/profile
 * Update doctor profile (supports JWT or link token)
 */
export async function PUT(request: NextRequest) {
  const cookieStore = await cookies();
  const jwtToken = cookieStore.get('auth_token')?.value || null;
  const linkToken = request.nextUrl.searchParams.get('token');

  if (!jwtToken && !linkToken) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
      { status: 401 },
    );
  }

  try {
    const body: UpdateDoctorProfileRequest = await request.json();

    const response = await backendPut<ApiResponse<DoctorProfileResponse>>(
      `/api/auth/profile${linkToken ? `?token=${linkToken}` : ''}`,
      body,
      undefined,
      buildHeaders(jwtToken, linkToken),
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update profile', statusCode: 500 } },
      { status: 500 },
    );
  }
}

