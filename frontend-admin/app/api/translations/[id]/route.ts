import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet, backendPut, backendDelete } from '@/src/lib/backend-client';
import { ApiResponse, Translation, UpdateTranslationRequest } from '@/src/types/api.types';

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value;
}

/**
 * GET /api/translations/[id]
 * Get translation by ID (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    const { id } = await params;
    const response = await backendGet<ApiResponse<Translation>>(`/api/translations/${id}`, token);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch translation', statusCode: 500 } },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/translations/[id]
 * Update a translation (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body: UpdateTranslationRequest = await request.json();
    const response = await backendPut<ApiResponse<Translation>>(`/api/translations/${id}`, body, token);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update translation', statusCode: 500 } },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/translations/[id]
 * Delete a translation (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken();

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    const { id } = await params;
    await backendDelete(`/api/translations/${id}`, token);
    return NextResponse.json({ success: true, message: 'Translation deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete translation', statusCode: 500 } },
      { status: 500 },
    );
  }
}

