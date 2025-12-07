import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet, backendPut } from '@/src/lib/backend-client';
import { ApiResponse, FeedbackResponse, UpdateFeedbackRequest } from '@/src/types/api.types';

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value;
}

/**
 * GET /api/feedback/[id]
 * Get a single feedback entry by ID (admin only)
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
    const response = await backendGet<ApiResponse<FeedbackResponse>>(
      `/api/feedback/${id}`,
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

/**
 * PUT /api/feedback/[id]
 * Update feedback status and admin response (admin only)
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
    const body: UpdateFeedbackRequest = await request.json();
    const response = await backendPut<ApiResponse<FeedbackResponse>>(
      `/api/feedback/${id}`,
      body,
      token,
    );
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update feedback', statusCode: 500 } },
      { status: 500 },
    );
  }
}

