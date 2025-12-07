import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet, backendPost } from '@/src/lib/backend-client';
import { ApiResponse, User, CreateUserRequest } from '@/src/types/api.types';

/**
 * GET /api/users
 * Get all users (doctors)
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    const response = await backendGet<ApiResponse<User[]>>('/api/auth/users', token);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch users', statusCode: 500 } },
      { status: 500 },
    );
  }
}

/**
 * POST /api/users
 * Create a new user (doctor)
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    const body: CreateUserRequest = await request.json();
    const response = await backendPost<ApiResponse<User>>('/api/auth/users', body, token);
    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create user', statusCode: 500 } },
      { status: 500 },
    );
  }
}

