import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendGet } from '@/src/lib/backend-client';
import { ApiResponse, Vaccination } from '@/src/types/api.types';

/**
 * GET /api/vaccinations
 * Get all vaccinations (public endpoint for doctors)
 */
export async function GET(request: NextRequest) {
  try {
    // Extract language parameter from query string
    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get('language');
    const languageParam = language ? `?language=${encodeURIComponent(language)}` : '';
    
    // Vaccinations are public for doctors, no auth required
    const response = await backendGet<ApiResponse<Vaccination[]>>(`/api/vaccinations${languageParam}`);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch vaccinations', statusCode: 500 } },
      { status: 500 },
    );
  }
}

