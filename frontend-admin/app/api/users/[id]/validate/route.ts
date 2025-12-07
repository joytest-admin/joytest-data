import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendPost } from '@/src/lib/backend-client';
import { ApiResponse, User, ValidateUserRequest } from '@/src/types/api.types';

/**
 * POST /api/users/[id]/validate
 * Validate (approve or reject) a preregistered user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    // Handle params as Promise (Next.js 15+) or object (Next.js 14)
    const resolvedParams = params instanceof Promise ? await params : params;
    
    if (!resolvedParams.id) {
      return NextResponse.json(
        { success: false, error: { message: 'User ID is required', statusCode: 400 } },
        { status: 400 },
      );
    }

    const body: ValidateUserRequest = await request.json();

    const response = await backendPost<ApiResponse<User>>(
      `/api/auth/users/${resolvedParams.id}/validate`,
      body,
      token,
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to validate user', statusCode: 500 } },
      { status: 500 },
    );
  }
}

