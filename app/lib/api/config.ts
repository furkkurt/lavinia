// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://23.95.193.212:5000';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Helper function to get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Helper function to set auth token
export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
};

// Helper function to remove auth token
export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
};

// Fetch wrapper with authentication
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for session-based auth
    });

    let data: any = {};
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        // If JSON parsing fails, try to get text
        const text = await response.text();
        if (text) {
          data = { message: text };
        }
      }
    } else {
      const text = await response.text();
      if (text) {
        data = { message: text };
      }
    }

    if (!response.ok) {
      // Try to extract error message from various possible formats
      const errorMessage = 
        data.message || 
        data.error || 
        data.title ||
        (Array.isArray(data.errors) ? data.errors.map((e: any) => e.message || e).join(', ') : null) ||
        (data.ModelState && Object.values(data.ModelState).flat().join(', ')) ||
        `HTTP ${response.status}: ${response.statusText}`;
      
      // Only log non-401 and non-404 errors to avoid console spam for public pages
      // 404 means endpoint doesn't exist (backend not deployed/updated)
      // 401 means unauthorized (shouldn't happen with public endpoints)
      if (response.status !== 401 && response.status !== 404) {
        console.error('API Error:', {
          url,
          status: response.status,
          statusText: response.statusText,
          data,
          errorMessage
        });
      }

      return {
        status: response.status,
        error: errorMessage,
      };
    }

    return {
      status: response.status,
      data: data as T,
    };
  } catch (error) {
    console.error('Network Error:', error);
    return {
      status: 500,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Fetch wrapper for multipart/form-data (file uploads)
export async function apiFetchMultipart<T>(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      method: options.method || 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        status: response.status,
        error: data.message || data.error || 'An error occurred',
      };
    }

    return {
      status: response.status,
      data: data as T,
    };
  } catch (error) {
    return {
      status: 500,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
