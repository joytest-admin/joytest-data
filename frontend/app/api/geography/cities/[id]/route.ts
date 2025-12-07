import { NextRequest, NextResponse } from 'next/server';
import { backendGet } from '@/src/lib/backend-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await backendGet(`/api/geography/cities/${id}`);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch city' } },
      { status: 500 },
    );
  }
}

