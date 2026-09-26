// API client wrapper for backend communication

import { auth } from './auth';
import type { ApiResponse, LoginResponse } from './types';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from './utils/pagination';

// Default to local ecomhub-core. Production (Vercel) must set NEXT_PUBLIC_API_BASE_URL.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const API_VERSION = '/api/v1';

if (process.env.NODE_ENV === 'development') {
  console.info(`[api] base URL: ${API_BASE_URL}`);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ErrorBody = {
  message?: string;
  business_code?: string;
};

function isAuthSessionEndpoint(endpoint: string): boolean {
  return (
    endpoint.includes('/auth/login') ||
    endpoint.includes('/auth/refresh') ||
    endpoint.includes('/auth/register')
  );
}

function clearClientSession(): void {
  auth.clearToken();
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user_roles');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_id');
}

/** FE1 — unrecoverable auth failure: clear state and force login (not on login page). */
function forceReLogin(): void {
  clearClientSession();
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/login')) return;
  const redirect = encodeURIComponent(
    `${window.location.pathname}${window.location.search}`
  );
  window.location.replace(`/login?redirect=${redirect}`);
}

let refreshInFlight: Promise<boolean> | null = null;

/** Single-flight refresh using HttpOnly cookie (credentials: include). */
async function tryRefreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_VERSION}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) return false;
      const envelope: ApiResponse<LoginResponse> = await response.json();
      const access = envelope?.data?.access_token;
      if (!access) return false;
      auth.setToken(access);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * FE6 — true if an access token is already in sessionStorage, or a silent
 * refresh (HttpOnly cookie) succeeds. Used by the dashboard route guard so a
 * new tab can recover the session without forcing login.
 */
export async function ensureAccessToken(): Promise<boolean> {
  if (auth.isAuthenticated()) return true;
  return tryRefreshAccessToken();
}

function mapErrorMessage(status: number, errorData: ErrorBody): string {
  let errorMessage = errorData.message || `HTTP error! status: ${status}`;

  if (status >= 500) {
    errorMessage = `Server error: ${errorData.message || 'Something went wrong on our end'}. Please try again later or contact admin if the problem persists.`;
  } else if (status === 404) {
    errorMessage = `Resource not found: ${errorData.message || 'The requested item does not exist'}`;
  } else if (status === 429) {
    errorMessage =
      errorData.message ||
      'Too many attempts. Please wait a minute and try again.';
  } else if (
    errorData.business_code === '93' ||
    errorData.message?.toLowerCase().includes('token has been revoked')
  ) {
    errorMessage = 'Token has been revoked. Please login again.';
  } else if (status === 401) {
    errorMessage = 'Unauthorized. Please login again.';
  } else if (status === 403) {
    errorMessage =
      'Access denied. You do not have permission to perform this action.';
  } else if (status === 400) {
    errorMessage = `Invalid request: ${errorData.message || 'Please check your input'}`;
  }

  return errorMessage;
}

async function parseError(response: Response): Promise<ApiError> {
  const errorData = (await response.json().catch(() => ({}))) as ErrorBody;
  return new ApiError(
    mapErrorMessage(response.status, errorData),
    response.status,
    errorData
  );
}

async function handleSuccess<T>(response: Response): Promise<T> {
  const data: ApiResponse<T> = await response.json();
  return data.data;
}

type RequestOptions = RequestInit & {
  /** Skip Bearer header (unused today; reserved). */
  skipAuth?: boolean;
};

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const buildHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };
    if (!options?.skipAuth) {
      const raw = auth.getToken();
      if (raw) {
        const cleanToken = raw.trim().replace(/^Bearer\s+/i, '');
        if (cleanToken) headers['Authorization'] = `Bearer ${cleanToken}`;
      }
    }
    return headers;
  };

  const doFetch = () =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method,
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

  let response = await doFetch();

  if (response.status === 401 && !isAuthSessionEndpoint(endpoint)) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      response = await doFetch();
    } else {
      forceReLogin();
      throw await parseError(response);
    }
  }

  if (!response.ok) {
    const err = await parseError(response);
    // Revoked / hard unauthorized on session endpoints: clear local state
    if (
      !isAuthSessionEndpoint(endpoint) &&
      (err.status === 401 ||
        (err.data as ErrorBody)?.business_code === '93')
    ) {
      forceReLogin();
    }
    throw err;
  }

  return handleSuccess<T>(response);
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>('GET', endpoint, undefined, options),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', endpoint, body, options),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', endpoint, body, options),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', endpoint, body, options),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>('DELETE', endpoint, undefined, options),
};

// Auth endpoints
export const authApi = {
  login: async (username: string, password: string) => {
    return api.post<LoginResponse>(`${API_VERSION}/auth/login`, {
      username,
      password,
    });
  },
  logout: async () => {
    return api.post<null>(`${API_VERSION}/auth/logout`);
  },
  refresh: async () => {
    return api.post<LoginResponse>(`${API_VERSION}/auth/refresh`);
  },
  getMe: async () => {
    return api.get<import('./types').GetMeResponse>(`${API_VERSION}/auth/me`);
  },
};

export const masterCategoryApi = {
  getTree: async () => {
    return api.get<Array<import('./types').MasterCategoryTree>>(
      `${API_VERSION}/categories/tree`
    );
  },
  getAll: async (
    page: number = DEFAULT_PAGE,
    limit: number = DEFAULT_PAGE_SIZE,
    search?: string
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    return api.get<
      import('./types').PaginatedResponse<import('./types').MasterCategory>
    >(`${API_VERSION}/categories?${params.toString()}`);
  },
  create: async (data: import('./types').CreateMasterCategoryParam) => {
    return api.post<import('./types').MasterCategory>(
      `${API_VERSION}/categories`,
      data
    );
  },
  update: async (
    id: number,
    data: import('./types').UpdateMasterCategoryParam
  ) => {
    return api.put<import('./types').MasterCategory>(
      `${API_VERSION}/categories/${id}`,
      data
    );
  },
  delete: async (id: number) => {
    return api.delete<{ message: string }>(`${API_VERSION}/categories/${id}`);
  },
};
