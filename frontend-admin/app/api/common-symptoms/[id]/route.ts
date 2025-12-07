/**
 * Common symptom by ID API route
 * Handles update and delete operations for a specific common symptom
 */

import { NextRequest, NextResponse } from 'next/server';
import { backendPut, backendDelete } from '@/src/lib/backend-client';
import { CommonSymptom, UpdateCommonSymptomRequest } from '@/src/types/api.types';
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
    const body: UpdateCommonSymptomRequest = await request.json();
    const response = await backendPut<{ success: boolean; data: CommonSymptom }>(
      `/api/common-symptoms/${id}`,
      body,
      token,
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to update common symptom',
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
      `/api/common-symptoms/${id}`,
      token,
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to delete common symptom',
          statusCode: 500,
        },
      },
      { status: 500 },
    );
  }
}

