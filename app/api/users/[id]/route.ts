import { NextRequest, NextResponse } from 'next/server';
import { bearerFromRequest, serverInternalApiBase } from '@/app/lib/serverInternalApiBase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${serverInternalApiBase()}/api/users/${id}`, {
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const response = await fetch(`${serverInternalApiBase()}/api/users/${id}`, {
      method: 'PUT',
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${serverInternalApiBase()}/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        ...bearerFromRequest(request),
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.message || data.error || 'An error occurred' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true }, { status: response.status });
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Network error' },
      { status: 500 }
    );
  }
}
