/**
 * DELETE /api/test-results/[id]
 * Delete a test result (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendDelete } from '@/src/lib/backend-client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Unauthorized',
            statusCode: 401,
          },
        },
        { status: 401 },
      );
    }

    const response = await backendDelete(`/api/test-results/${id}/admin`, token);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to delete test result',
          statusCode: error.statusCode || 500,
        },
      },
      { status: error.statusCode || 500 },
    );
  }
}

