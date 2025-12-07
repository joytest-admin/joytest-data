import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet, backendPost } from '@/src/lib/backend-client';
import { ApiResponse, Patient, CreatePatientRequest } from '@/src/types/api.types';

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
 * GET /api/patients/my
 * Get all patients for the authenticated doctor
 * Supports both JWT token (from cookie) and link token (from query parameter)
 */
export async function GET(request: NextRequest) {
  try {
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

    const response = await backendGet<ApiResponse<Patient[]>>(
      `/api/patients/my${linkToken ? `?token=${linkToken}` : ''}`,
      undefined,
      buildHeaders(jwtToken, linkToken),
    );
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch patients', statusCode: 500 } },
      { status: 500 },
    );
  }
}

/**
 * POST /api/patients/my
 * Create a new patient
 * Supports both JWT token (from cookie) and link token (from query parameter)
 */
export async function POST(request: NextRequest) {
  try {
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

    const body: CreatePatientRequest = await request.json();
    const response = await backendPost<ApiResponse<Patient>>(
      `/api/patients/my${linkToken ? `?token=${linkToken}` : ''}`,
      body,
      undefined,
      buildHeaders(jwtToken, linkToken),
    );
    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create patient', statusCode: 500 } },
      { status: 500 },
    );
  }
}

