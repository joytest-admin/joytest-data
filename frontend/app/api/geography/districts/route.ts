import { NextRequest, NextResponse } from 'next/server';
import { backendGet } from '@/src/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const regionId = searchParams.get('regionId');
    const search = searchParams.get('q') || undefined;
    
    const params = new URLSearchParams();
    if (regionId) {
      params.append('regionId', regionId);
    }
    if (search) {
      params.append('q', search);
    }
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const result = await backendGet(`/api/geography/districts${query}`);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch districts' } },
      { status: 500 },
    );
  }
}

