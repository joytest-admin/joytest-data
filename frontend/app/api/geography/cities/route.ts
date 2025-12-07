import { NextRequest, NextResponse } from 'next/server';
import { backendGet } from '@/src/lib/backend-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const districtId = searchParams.get('districtId');
    const search = searchParams.get('q') || undefined;
    
    const params = new URLSearchParams();
    if (districtId) {
      params.append('districtId', districtId);
    }
    if (search) {
      params.append('q', search);
    }
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const result = await backendGet(`/api/geography/cities${query}`);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch cities' } },
      { status: 500 },
    );
  }
}

