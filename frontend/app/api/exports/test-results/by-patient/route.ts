import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet } from '@/src/lib/backend-client';

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
 * GET /api/exports/test-results/by-patient
 * Export test results by patient as CSV
 * Supports both JWT token (from cookie) and link token (from query parameter)
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const jwtToken = cookieStore.get('auth_token')?.value || null;

    const { searchParams } = new URL(request.url);
    const linkToken = searchParams.get('token');
    const patientId = searchParams.get('patientId');

    if (!jwtToken && !linkToken) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: { message: 'Patient ID is required', statusCode: 400 } },
        { status: 400 },
      );
    }

    const queryParams = new URLSearchParams();
    queryParams.append('patientId', patientId);
    if (linkToken) queryParams.append('token', linkToken);

    // Fetch CSV from backend
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const url = `${baseUrl}/api/exports/test-results/by-patient?${queryParams.toString()}`;

    const headers: Record<string, string> = {};
    if (jwtToken) {
      headers.Authorization = `Bearer ${jwtToken}`;
    }
    if (linkToken) {
      headers['x-link-token'] = linkToken;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { success: false, error: { message: error.error?.message || 'Failed to export', statusCode: response.status } },
        { status: response.status },
      );
    }

    // Get CSV content and filename from response
    const csv = await response.text();
    const contentDisposition = response.headers.get('content-disposition') || '';
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    const filename = filenameMatch ? filenameMatch[1] : 'test-results.csv';

    // Return CSV as response with proper headers
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to export test results', statusCode: 500 } },
      { status: 500 },
    );
  }
}

