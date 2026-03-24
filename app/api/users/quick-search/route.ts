import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://31.210.43.159:5000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('Name');
    const email = searchParams.get('Email');
    
    const params = new URLSearchParams();
    if (name) params.append('Name', name);
    if (email) params.append('Email', email);
    
    const response = await fetch(`${API_BASE_URL}/api/users/quick-search?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || 'An error occurred' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Network error' },
      { status: 500 }
    );
  }
}
