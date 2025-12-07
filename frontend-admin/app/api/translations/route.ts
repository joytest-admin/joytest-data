import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet, backendPost } from '@/src/lib/backend-client';
import { ApiResponse, Translation } from '@/src/types/api.types';

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value;
}

/**
 * GET /api/translations
 * Get all translations (admin only)
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
    const entityType = searchParams.get('entityType');
    const languageCode = searchParams.get('languageCode');

    const queryParams = new URLSearchParams();
    if (entityType) queryParams.append('entityType', entityType);
    if (languageCode) queryParams.append('languageCode', languageCode);

    const response = await backendGet<ApiResponse<Translation[]>>(
      `/api/translations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      token,
    );
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch translations', statusCode: 500 } },
      { status: 500 },
    );
  }
}

/**
 * POST /api/translations
 * Create a new translation (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const response = await backendPost<ApiResponse<Translation>>('/api/translations', body, token);
    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create translation', statusCode: 500 } },
      { status: 500 },
    );
  }
}

