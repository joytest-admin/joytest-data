/**
 * Common symptoms API route
 * Handles CRUD operations for common symptoms
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  backendGet,
  backendPost,
} from '@/src/lib/backend-client';
import { CommonSymptom, CreateCommonSymptomRequest } from '@/src/types/api.types';
import { cookies } from 'next/headers';

async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  // Debug: log all cookies in development
  if (process.env.NODE_ENV === 'development' && !token) {
    const allCookies = cookieStore.getAll();
    console.log(`[api/common-symptoms] All cookies:`, allCookies.map(c => c.name));
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
      console.log(`[api/common-symptoms] Token retrieved: ${token ? 'Yes' : 'No'}${token ? ` (${token.substring(0, 20)}...)` : ''}`);
    }

    const response = await backendGet<{ success: boolean; data: CommonSymptom[] }>(
      '/api/common-symptoms',
      token,
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch common symptoms',
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

    const body: CreateCommonSymptomRequest = await request.json();
    const response = await backendPost<{ success: boolean; data: CommonSymptom }>(
      '/api/common-symptoms',
      body,
      token,
    );

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to create common symptom',
          statusCode: 500,
        },
      },
      { status: 500 },
    );
  }
}

