/**
 * Test type by ID API route
 * Handles update and delete operations for a specific test type
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendPut, backendDelete } from '@/src/lib/backend-client';
import { TestType, UpdateTestTypeRequest } from '@/src/types/api.types';
import { cookies } from 'next/headers';

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value;
}

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
    const body: UpdateTestTypeRequest = await request.json();
    const response = await backendPut<{ success: boolean; data: TestType }>(
      `/api/test-types/${id}`,
      body,
      token,
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to update test type',
          statusCode: 500,
        },
      },
      { status: 500 },
    );
  }
}

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
    const response = await backendDelete<{ success: boolean; message: string }>(
      `/api/test-types/${id}`,
      token,
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to delete test type',
          statusCode: 500,
        },
      },
      { status: 500 },
    );
  }
}

