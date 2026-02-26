import { API_BASE_URL, apiFetch } from './config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AdminLoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

// Register new user via /api/users endpoint (no Authorization header for public registration)
export async function register(data: RegisterData): Promise<{ success: boolean; error?: string }> {
  try {
    // Use /api/users POST endpoint without Authorization header (public registration)
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // IMPORTANT: do NOT send Authorization header here for public registration
      credentials: 'include', // allow backend to set cookies if it wants
      body: JSON.stringify({
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber || '',
        password: data.password,
        roleIds: [], // Default role for new users
        customerGroupIds: [],
      }),
    });

    if (response.ok) {
      return { success: true };
    }

    // Try to extract meaningful error message from backend
    let errorMessage = 'Kayıt sırasında bir hata oluştu.';
    try {
      const errorBody = await response.json();
      errorMessage =
        errorBody.message ||
        errorBody.error ||
        (Array.isArray(errorBody.errors)
          ? errorBody.errors.join(', ')
          : errorBody.errors
          ? Object.values(errorBody.errors).flat().join(', ')
          : null) ||
        `HTTP ${response.status}: ${response.statusText}`;
    } catch {
      // Fallback to status text if JSON parse fails
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }

    return { success: false, error: errorMessage };
  } catch (error: any) {
    console.error('Register error:', error);
    return { 
      success: false, 
      error: error.message || 'Kayıt sırasında bir hata oluştu.' 
    };
  }
}

// Login - For regular users, verify via UserApi (development workaround)
export async function login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
  try {
    // Import quickSearchUsers dynamically to avoid circular dependency
    const { quickSearchUsers } = await import('./users');
    
    // Try to find user by email
    const users = await quickSearchUsers(undefined, credentials.email);

    // If user found, allow login (development bypass - password verification would need backend support)
    if (users && users.length > 0) {
      // Store user info in localStorage for session management
      const user = users[0];
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      }));
      
      return { success: true };
    }

    // If no user found, return error
    return { 
      success: false, 
      error: 'E-posta veya şifre hatalı.' 
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.message || 'Giriş yapılırken bir hata oluştu.' 
    };
  }
}

// Admin Login - Development bypass for admin access
// Since there's no public login endpoint and UserApi requires authentication,
// we use a simple development bypass for admin/admin credentials
// TODO: Replace with proper authentication when backend login endpoint is available
export async function adminLogin(credentials: AdminLoginCredentials): Promise<{ success: boolean; error?: string }> {
  try {
    // Development bypass: Accept "admin" username with "admin" password
    // This matches the previous working behavior
    if (credentials.username.toLowerCase() === 'admin' && credentials.password === 'admin') {
      // Store admin session in localStorage
      localStorage.setItem('adminUser', JSON.stringify({
        id: 1,
        username: 'admin',
        fullName: 'Admin',
        email: 'admin@example.com',
      }));
      
      return { success: true };
    }

    // For other credentials, you could try to verify via API if needed
    // But since UserApi requires auth, we can't verify without being logged in first
    
    return { 
      success: false, 
      error: 'Kullanıcı adı veya şifre hatalı. (Development: admin/admin)' 
    };
  } catch (error: any) {
    console.error('Admin login error:', error);
    return { 
      success: false, 
      error: error.message || 'Giriş yapılırken bir hata oluştu.' 
    };
  }
}

// Get current user - check if user is authenticated
// Note: This endpoint doesn't exist in the API, so we return null
export async function getCurrentUser(): Promise<any | null> {
  // Endpoint doesn't exist, return null silently
  return null;
}

// Logout
// Note: This endpoint doesn't exist in the API, so we just clear localStorage
export async function logout(): Promise<boolean> {
  // Clear local storage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('adminUser');
  }
  return true;
}
