import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet, backendPost } from '@/src/lib/backend-client';
import { ApiResponse, FeedbackResponse, CreateFeedbackRequest } from '@/src/types/api.types';

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
 * GET /api/feedback/my
 * Get all feedback for the authenticated doctor
 * Supports both JWT token (from cookie) and link token (from query parameter)
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const jwtToken = cookieStore.get('auth_token')?.value || null;

    const { searchParams } = new URL(request.url);
    const linkToken = searchParams.get('token');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!jwtToken && !linkToken) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit);
    if (offset) queryParams.append('offset', offset);
    if (linkToken) queryParams.append('token', linkToken);

    const response = await backendGet<ApiResponse<{ results: FeedbackResponse[]; total: number }>>(
      `/api/feedback/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      undefined,
      buildHeaders(jwtToken, linkToken),
    );
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch feedback', statusCode: 500 } },
      { status: 500 },
    );
  }
}


