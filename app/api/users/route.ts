import { NextRequest, NextResponse } from 'next/server';
import { bearerFromRequest, serverInternalApiBase } from '@/app/lib/serverInternalApiBase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${serverInternalApiBase()}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...bearerFromRequest(request),
      },
      body: JSON.stringify(body),
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
