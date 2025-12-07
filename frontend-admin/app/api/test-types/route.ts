/**
 * Test types API route
 * Handles CRUD operations for test types
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  backendGet,
  backendPost,
  backendPut,
  backendDelete,
} from '@/src/lib/backend-client';
import { TestType, CreateTestTypeRequest, UpdateTestTypeRequest } from '@/src/types/api.types';
import { cookies } from 'next/headers';

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  // Debug: log all cookies in development
  if (process.env.NODE_ENV === 'development' && !token) {
    const allCookies = cookieStore.getAll();
    console.log(`[api/test-types] All cookies:`, allCookies.map(c => c.name));
  }
  
  return token;
}

export async function GET() {
  try {
    const token = await getToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[api/test-types] Token retrieved: ${token ? 'Yes' : 'No'}${token ? ` (${token.substring(0, 20)}...)` : ''}`);
    }

    const response = await backendGet<{ success: boolean; data: TestType[] }>(
      '/api/test-types',
      token,
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch test types',
          statusCode: 500,
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', statusCode: 401 } },
        { status: 401 },
      );
    }

    const body: CreateTestTypeRequest = await request.json();
    const response = await backendPost<{ success: boolean; data: TestType }>(
      '/api/test-types',
      body,
      token,
    );

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to create test type',
          statusCode: 500,
        },
      },
      { status: 500 },
    );
  }
}

