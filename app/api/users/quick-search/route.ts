import { NextRequest, NextResponse } from 'next/server';
import { bearerFromRequest, serverInternalApiBase } from '@/app/lib/serverInternalApiBase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('Name');
    const email = searchParams.get('Email');
    
    const params = new URLSearchParams();
    if (name) params.append('Name', name);
    if (email) params.append('Email', email);
    
    const response = await fetch(`${serverInternalApiBase()}/api/users/quick-search?${params.toString()}`, {
      method: 'GET',
      headers: {
        ...bearerFromRequest(request),
      },
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
