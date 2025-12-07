import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value;
}

/**
 * GET /api/exports/test-results/admin
 * Export test results with filters as CSV (admin only)
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

    const queryParams = new URLSearchParams();
    if (city) queryParams.append('city', city);
    if (doctorId) queryParams.append('doctorId', doctorId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    // Fetch CSV from backend using fetch (since backendGet expects JSON)
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const url = `${baseUrl}/api/exports/test-results/admin?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

