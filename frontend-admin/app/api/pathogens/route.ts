/**
 * Pathogens API route
 * Handles GET (list all) and POST (create) operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet, backendPost } from '@/src/lib/backend-client';
import { Pathogen, ApiResponse } from '@/src/types/api.types';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized', statusCode: 401 } }, { status: 401 });
    }

    const response = await backendGet<{ success: boolean; data: Pathogen[] }>('/api/pathogens', token);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error', statusCode: 500 } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized', statusCode: 401 } }, { status: 401 });
    }

    const body = await request.json();
    const response = await backendPost<ApiResponse<Pathogen>>('/api/pathogens', body, token);
    return NextResponse.json(response, { status: response.success ? 201 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error', statusCode: 500 } },
      { status: 500 },
    );
  }
}

