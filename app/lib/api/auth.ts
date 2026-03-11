import { API_BASE_URL, apiFetch, setAuthToken, removeAuthToken } from './config';

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

// Register new user via /api/account/register endpoint (public, no auth required)
export async function register(data: RegisterData): Promise<{ success: boolean; error?: string }> {
  try {
    // Use /api/account/register endpoint - this is the public registration endpoint with [AllowAnonymous]
    const response = await fetch(`${API_BASE_URL}/api/account/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // IMPORTANT: do NOT send Authorization header here for public registration
      credentials: 'include', // allow backend to set cookies if it wants
      body: JSON.stringify({
        fullName: data.fullName,
        email: data.email,
        ...(data.phoneNumber ? { phoneNumber: data.phoneNumber } : {}),
        password: data.password,
      }),
    });

    if (response.ok) {
      return { success: true };
    }

    if (response.status === 409) {
      return { success: false, error: 'Bu e-posta adresi zaten kullanımda. Lütfen farklı bir e-posta adresi deneyin veya giriş yapın.' };
    }

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

// Login - Calls backend POST /api/account/login for real authentication with JWT token.
export async function login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/account/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        emailOrUserName: credentials.email.trim(),
        password: credentials.password,
        rememberMe: true,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || 'E-posta veya şifre hatalı.',
      };
    }

    const token = (data as any).accessToken;
    if (token) {
      setAuthToken(token);
    }

    localStorage.setItem('user', JSON.stringify({
      id: (data as any).id ?? 0,
      email: (data as any).email ?? credentials.email,
      fullName: (data as any).fullName ?? '',
    }));

    return { success: true };
  } catch (error: any) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.message || 'Giriş yapılırken bir hata oluştu.' 
    };
  }
}

// Admin Login - Calls backend POST /api/account/login for cookie-based auth.
// On success, backend sets auth cookie; subsequent admin API calls (products, users) send it.
export async function adminLogin(credentials: AdminLoginCredentials): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/account/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        emailOrUserName: credentials.username.trim(),
        password: credentials.password,
        rememberMe: true,
      }),
    });

    const data = await response.json().catch(() => ({}));
    const errorMessage = data?.error || (response.ok ? null : `HTTP ${response.status}: ${response.statusText}`);

    if (!response.ok) {
      return {
        success: false,
        error: errorMessage || 'Kullanıcı adı veya şifre hatalı.',
      };
    }

    // Backend returns { userName, fullName, email, accessToken }; store token for cross-origin API calls (Bearer)
    const token = (data as any).accessToken;
    if (token) {
      setAuthToken(token);
    }
    localStorage.setItem(
      'adminUser',
      JSON.stringify({
        id: (data as any).id ?? 1,
        username: (data as any).userName ?? credentials.username,
        fullName: (data as any).fullName ?? 'Admin',
        email: (data as any).email ?? '',
      })
    );
    localStorage.setItem('isLoggedIn', 'true');

    return { success: true };
  } catch (error: any) {
    console.error('Admin login error:', error);
    return {
      success: false,
      error: error?.message || 'Giriş yapılırken bir hata oluştu.',
    };
  }
}

// Get current user from localStorage (admin or regular user)
export async function getCurrentUser(): Promise<any | null> {
  if (typeof window === 'undefined') return null;
  try {
    const adminStr = localStorage.getItem('adminUser');
    if (adminStr) return JSON.parse(adminStr);
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
  } catch {}
  return null;
}

// Logout - clear backend session (cookie) when admin was logged in, then clear localStorage
export async function logout(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const hadAdmin = !!localStorage.getItem('adminUser');
    if (hadAdmin) {
      try {
        await fetch(`${API_BASE_URL}/api/account/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch {
        // Ignore; we still clear local state
      }
    }
    localStorage.removeItem('isLoggedIn');
    removeAuthToken();
    localStorage.removeItem('user');
    localStorage.removeItem('adminUser');
  }
  return true;
}
