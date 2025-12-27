// Authentication helpers for JWT token management

// Store token in memory (alternative to http-only cookie)
// In production, consider using http-only cookies set by the backend
let token: string | null = null;

// Helper to set cookie (for middleware access)
const setCookie = (name: string, value: string, days: number = 1) => {
  if (typeof window === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

// Helper to delete cookie
const deleteCookie = (name: string) => {
  if (typeof window === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const auth = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    // Try to get from memory first
    if (token) return token;
    // Fallback to sessionStorage (more persistent than memory, but still client-side)
    return sessionStorage.getItem('access_token');
  },

  setToken: (newToken: string): void => {
    if (!newToken) {
      console.warn('setToken called with empty token');
      return;
    }
    // Clean token: remove any "Bearer " prefix and trim whitespace
    const cleanToken = newToken.trim().replace(/^Bearer\s+/i, '');
    token = cleanToken;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access_token', cleanToken);
      // Also set cookie for middleware access (non-httpOnly, client can set)
      setCookie('access_token', cleanToken, 1);
    }
  },

  clearToken: (): void => {
    token = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('access_token');
      deleteCookie('access_token');
    }
  },

  isAuthenticated: (): boolean => {
    return !!auth.getToken();
  },
};

