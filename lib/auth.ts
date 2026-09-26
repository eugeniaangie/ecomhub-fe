// Authentication helpers for JWT access-token management.
// Refresh token is HttpOnly (set by API) — never read or written here.

let token: string | null = null;

/** Remove legacy client-writable access_token cookie if present. */
const deleteLegacyAccessCookie = () => {
  if (typeof window === 'undefined') return;
  document.cookie = 'access_token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
};

export const auth = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    if (token) return token;
    return sessionStorage.getItem('access_token');
  },

  setToken: (newToken: string): void => {
    if (!newToken) {
      console.warn('setToken called with empty token');
      return;
    }
    const cleanToken = newToken.trim().replace(/^Bearer\s+/i, '');
    token = cleanToken;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access_token', cleanToken);
      // Drop any old non-httpOnly cookie from pre-T28b clients
      deleteLegacyAccessCookie();
    }
  },

  clearToken: (): void => {
    token = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('access_token');
      deleteLegacyAccessCookie();
    }
  },

  isAuthenticated: (): boolean => {
    return !!auth.getToken();
  },
};
