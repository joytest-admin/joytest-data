import { NextRequest, NextResponse } from 'next/server';
import { backendGet } from '@/src/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('q') || undefined;
    const url = search ? `/api/geography/regions?q=${encodeURIComponent(search)}` : '/api/geography/regions';
    const result = await backendGet(url);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch regions' } },
      { status: 500 },
    );
  }
}

