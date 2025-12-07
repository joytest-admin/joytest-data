import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet, backendPut } from '@/src/lib/backend-client';
import { ApiResponse, FeedbackResponse, UpdateFeedbackRequest } from '@/src/types/api.types';

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value;
}

/**
 * GET /api/feedback
 * Get all feedback entries (admin only)
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
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (category) queryParams.append('category', category);
    if (limit) queryParams.append('limit', limit);
    if (offset) queryParams.append('offset', offset);

    const response = await backendGet<ApiResponse<{ results: FeedbackResponse[]; total: number }>>(
      `/api/feedback${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      token,
    );
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch feedback', statusCode: 500 } },
      { status: 500 },
    );
  }
}

