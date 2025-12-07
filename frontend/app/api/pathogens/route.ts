import { NextRequest, NextResponse } from 'next/server';
import { backendGet } from '@/src/lib/backend-client';
import { ApiResponse, Pathogen } from '@/src/types/api.types';

/**
 * GET /api/pathogens
 * Get all pathogens (public endpoint for doctors)
 */
export async function GET(request: NextRequest) {
  try {
    // Extract language parameter from query string
    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get('language');
    const languageParam = language ? `?language=${encodeURIComponent(language)}` : '';
    
    // Pathogens are public for doctors, no auth required
    const response = await backendGet<ApiResponse<Pathogen[]>>(`/api/pathogens${languageParam}`);
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch pathogens', statusCode: 500 } },
      { status: 500 },
    );
  }
}

