import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendPost } from '@/src/lib/backend-client';
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

/**
 * POST /api/notifications/:id/dismiss
 * Supports both JWT token (cookie) and link token (query parameter).
 */
export async function POST(
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
    if (linkToken) queryParams.append('token', linkToken); // fallback
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';

    const response = await backendPost<ApiResponse>(
      `/api/notifications/${id}/dismiss${query}`,
      undefined,
      undefined,
      buildHeaders(jwtToken, linkToken),
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to dismiss notification', statusCode: 500 } },
      { status: 500 },
    );
  }
}

