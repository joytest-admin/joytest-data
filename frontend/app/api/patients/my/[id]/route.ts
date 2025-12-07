import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet, backendPut } from '@/src/lib/backend-client';
import { ApiResponse, Patient, UpdatePatientRequest } from '@/src/types/api.types';

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
 * GET /api/patients/my/[id]
 * Get a single patient by ID (doctor only)
 * Supports both JWT token (from cookie) and link token (from query parameter)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const jwtToken = cookieStore.get('auth_token')?.value || null;

    const { searchParams } = new URL(request.url);
    const linkToken = searchParams.get('token');

    if (!jwtToken && !linkToken) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    const queryParams = new URLSearchParams();
    if (linkToken) queryParams.append('token', linkToken);

    const response = await backendGet<ApiResponse<Patient>>(
      `/api/patients/my/${id}?${queryParams.toString()}`,
      undefined,
      buildHeaders(jwtToken, linkToken),
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch patient', statusCode: 500 } },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/patients/my/[id]
 * Update a patient by ID (doctor only)
 * Supports both JWT token (from cookie) and link token (from query parameter)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const jwtToken = cookieStore.get('auth_token')?.value || null;

    const { searchParams } = new URL(request.url);
    const linkToken = searchParams.get('token');

    if (!jwtToken && !linkToken) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    const body: UpdatePatientRequest = await request.json();

    const queryParams = new URLSearchParams();
    if (linkToken) queryParams.append('token', linkToken);

    const response = await backendPut<ApiResponse<Patient>>(
      `/api/patients/my/${id}?${queryParams.toString()}`,
      body,
      undefined,
      buildHeaders(jwtToken, linkToken),
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update patient', statusCode: 500 } },
      { status: 500 },
    );
  }
}

