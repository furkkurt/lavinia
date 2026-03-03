// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://23.95.193.212:5000';

// Helper function to get full image URL from backend
export function getImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) {
    return '/images/product-item-1.jpg';
  }
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it starts with /, it's a backend path - prepend API base URL
  if (imagePath.startsWith('/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  
  // Otherwise, assume it's a relative path from backend
  return `${API_BASE_URL}/${imagePath}`;
}

// Import debug utility
let debugMemory: any = null;
if (typeof window !== 'undefined') {
  try {
    debugMemory = require('./debug').debugMemory;
  } catch (e) {
    // Debug module not available
  }
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Request deduplication: prevent multiple simultaneous identical GET requests
// IMMEDIATE cleanup - no timers to prevent memory leaks
const pendingGetRequests = new Map<string, Promise<any>>();

// Generate a cache key from endpoint (only for GET requests)
function getRequestKey(endpoint: string, options: RequestInit = {}): string {
  // Include method and body in key for POST requests to avoid conflicts
  const method = options.method || 'GET';
  const bodyKey = options.body ? `:${JSON.stringify(options.body).substring(0, 50)}` : '';
  return `${method}:${endpoint}${bodyKey}`;
}

// Clean up old pending requests immediately when map gets too large
function cleanupPendingRequests() {
  // Immediate cleanup - no timers, no setTimeout
  if (pendingGetRequests.size > 50) {
    pendingGetRequests.clear();
  }
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
  // Clean up old pending requests immediately
  cleanupPendingRequests();
  
  // For GET requests only, use deduplication to prevent rapid-fire duplicate requests
  // POST/PUT/DELETE requests are never deduplicated
  const isGet = !options.method || options.method === 'GET';
  const requestKey = isGet ? getRequestKey(endpoint, options) : null;
  
  // If this is a GET request and we already have a pending identical request, return it
  // This prevents multiple identical GET requests from firing simultaneously
  if (isGet && requestKey && pendingGetRequests.has(requestKey)) {
    return pendingGetRequests.get(requestKey)!;
  }

  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Create the fetch promise
  const fetchPromise = (async () => {
    // Debug logging
    if (debugMemory) {
      debugMemory.logApiCall(endpoint);
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
      // Only log network errors if they're not 404/401 (expected for missing endpoints)
      if (!(error instanceof TypeError && error.message.includes('fetch'))) {
    console.error('Network Error:', error);
      }
    return {
      status: 500,
      error: error instanceof Error ? error.message : 'Network error',
    };
    } finally {
      // IMMEDIATE cleanup - no setTimeout to prevent memory leaks
      // Remove from pending requests immediately after completion
      if (isGet && requestKey) {
        // Use microtask to allow other simultaneous requests to use the same promise
        // But cleanup immediately, not after a delay
        Promise.resolve().then(() => {
          pendingGetRequests.delete(requestKey);
        });
      }
    }
  })();

  // Store the promise for GET requests to enable deduplication
  if (isGet && requestKey) {
    pendingGetRequests.set(requestKey, fetchPromise);
  }

  return fetchPromise;
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
