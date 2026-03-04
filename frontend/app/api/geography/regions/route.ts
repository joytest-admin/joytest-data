import { NextRequest, NextResponse } from 'next/server';
import { backendGet } from '@/src/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('q') || undefined;
    const country = searchParams.get('country') || undefined;

    const params = new URLSearchParams();
    if (search) {
      params.append('q', search);
    }
    if (country) {
      params.append('country', country);
    }
    const query = params.toString();
    const url = query ? `/api/geography/regions?${query}` : '/api/geography/regions';
    const result = await backendGet(url);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch regions' } },
      { status: 500 },
    );
  }
}

