import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendPost } from '@/src/lib/backend-client';
import { ApiResponse, User } from '@/src/types/api.types';

/**
 * POST /api/users/[id]/regenerate-token
 * Regenerate unique link token for a user
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

    const response = await backendPost<ApiResponse<User>>(
      `/api/auth/users/${resolvedParams.id}/regenerate-token`,
      {},
      token,
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to regenerate token', statusCode: 500 } },
      { status: 500 },
    );
  }
}

