import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendPost } from '@/src/lib/backend-client';
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
 * POST /api/feedback
 * Create a new feedback entry
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

    const body: CreateFeedbackRequest = await request.json();
    const queryParams = linkToken ? `?token=${linkToken}` : '';
    const response = await backendPost<ApiResponse<FeedbackResponse>>(
      `/api/feedback${queryParams}`,
      body,
      undefined,
      buildHeaders(jwtToken, linkToken),
    );
    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create feedback', statusCode: 500 } },
      { status: 500 },
    );
  }
}

