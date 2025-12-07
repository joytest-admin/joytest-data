import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendPut, backendDelete } from '@/src/lib/backend-client';
import { ApiResponse, User, UpdateUserRequest } from '@/src/types/api.types';

/**
 * PUT /api/users/[id]
 * Update a user (doctor)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    const { id } = await params;
    const body: UpdateUserRequest = await request.json();
    const response = await backendPut<ApiResponse<User>>(`/api/auth/users/${id}`, body, token);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update user', statusCode: 500 } },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a user (doctor)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    const { id } = await params;
    const response = await backendDelete<ApiResponse<{ message: string }>>(`/api/auth/users/${id}`, token);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete user', statusCode: 500 } },
      { status: 500 },
    );
  }
}

