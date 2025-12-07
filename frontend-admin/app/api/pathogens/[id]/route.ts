/**
 * Single pathogen API route
 * Handles PUT (update) and DELETE operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendPut, backendDelete } from '@/src/lib/backend-client';
import { Pathogen, ApiResponse } from '@/src/types/api.types';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized', statusCode: 401 } }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const response = await backendPut<ApiResponse<Pathogen>>(`/api/pathogens/${id}`, body, token);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error', statusCode: 500 } },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized', statusCode: 401 } }, { status: 401 });
    }

    const { id } = await params;
    const response = await backendDelete<ApiResponse<{ message: string }>>(`/api/pathogens/${id}`, token);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error', statusCode: 500 } },
      { status: 500 },
    );
  }
}

