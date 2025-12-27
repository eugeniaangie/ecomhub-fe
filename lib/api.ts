// API client wrapper for backend communication

import { auth } from './auth';
import type { ApiResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ecomhub-core-production.up.railway.app';
const API_VERSION = '/api/v1';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle different error statuses with user-friendly messages
    let errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
    
    if (response.status >= 500) {
      // Server errors (500+)
      errorMessage = `Server error: ${errorData.message || 'Something went wrong on our end'}. Please try again later or contact admin if the problem persists.`;
    } else if (response.status === 404) {
      errorMessage = `Resource not found: ${errorData.message || 'The requested item does not exist'}`;
    } else if (response.status === 401) {
      errorMessage = 'Unauthorized. Please login again.';
    } else if (response.status === 403) {
      errorMessage = 'Access denied. You do not have permission to perform this action.';
    } else if (response.status === 400) {
      errorMessage = `Invalid request: ${errorData.message || 'Please check your input'}`;
    }
    
    throw new ApiError(
      errorMessage,
      response.status,
      errorData
    );
  }

  const data: ApiResponse<T> = await response.json();
  return data.data;
}

export const api = {
  get: async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    const token = auth.getToken();
    const headers: Record<string, string> = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (token) {
      // Clean token: remove any "Bearer " prefix and trim whitespace
      const cleanToken = token.trim().replace(/^Bearer\s+/i, '');
      if (cleanToken) {
        headers['Authorization'] = `Bearer ${cleanToken}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
      ...options,
    });

    return handleResponse<T>(response);
  },

  post: async <T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> => {
    const token = auth.getToken();
    const headers: Record<string, string> = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (token) {
      // Clean token: remove any "Bearer " prefix and trim whitespace
      const cleanToken = token.trim().replace(/^Bearer\s+/i, '');
      if (cleanToken) {
        headers['Authorization'] = `Bearer ${cleanToken}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    return handleResponse<T>(response);
  },

  put: async <T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> => {
    const token = auth.getToken();
    const headers: Record<string, string> = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (token) {
      // Clean token: remove any "Bearer " prefix and trim whitespace
      const cleanToken = token.trim().replace(/^Bearer\s+/i, '');
      if (cleanToken) {
        headers['Authorization'] = `Bearer ${cleanToken}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    return handleResponse<T>(response);
  },

  delete: async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    const token = auth.getToken();
    const headers: Record<string, string> = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (token) {
      // Clean token: remove any "Bearer " prefix and trim whitespace
      const cleanToken = token.trim().replace(/^Bearer\s+/i, '');
      if (cleanToken) {
        headers['Authorization'] = `Bearer ${cleanToken}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      ...options,
    });

    return handleResponse<T>(response);
  },
};

// Auth endpoints
export const authApi = {
  login: async (username: string, password: string) => {
    return api.post<{ token: string; token_type?: string }>(`${API_VERSION}/auth/login`, {
      username,
      password,
    });
  },
};

// Dashboard endpoints
export const dashboardApi = {
  getSummary: async (month?: string) => {
    const params = month ? `?month=${month}` : '';
    return api.get<{
      total_income: number;
      total_expense: number;
      net_profit: number;
      period: string;
    }>(`/dashboard/summary${params}`);
  },
};

// Financial Records endpoints
export const transactionsApi = {
  getAll: async (type?: 'income' | 'expense') => {
    const params = type ? `?type=${type}` : '';
    return api.get<Array<import('./types').Transaction>>(`/transactions${params}`);
  },
  getById: async (id: string) => {
    return api.get<import('./types').Transaction>(`/transactions/${id}`);
  },
  create: async (data: import('./types').TransactionCreate) => {
    return api.post<import('./types').Transaction>('/transactions', data);
  },
  update: async (id: string, data: Partial<import('./types').TransactionCreate>) => {
    return api.put<import('./types').Transaction>(`/transactions/${id}`, data);
  },
  delete: async (id: string) => {
    return api.delete<{ message: string }>(`/transactions/${id}`);
  },
};

// Master Data endpoints (Legacy - using masterCategoryApi instead)
export const categoriesApi = {
  getAll: async () => {
    // Note: Backend doesn't support type filter, so parameter removed
    // Add default pagination parameters
    const params = new URLSearchParams({
      page: '1',
      limit: '10', // Get all categories
    });
    const response = await api.get<import('./types').PaginatedResponse<import('./types').MasterCategory>>(
      `${API_VERSION}/categories?${params.toString()}`
    );
    // Convert MasterCategory to Category format for backward compatibility
    return response.results.map(cat => ({
      id: cat.id.toString(),
      name: cat.category_name,
      type: 'income' as const, // Default since backend doesn't have type
      description: cat.description,
      created_at: cat.created_at,
      updated_at: cat.updated_at,
    }));
  },
  create: async (data: Omit<import('./types').Category, 'id' | 'created_at' | 'updated_at'>) => {
    // Convert legacy Category format to MasterCategory format
    const createData: import('./types').CreateMasterCategoryParam = {
      category_name: data.name,
      description: data.description,
    };
    const result = await api.post<import('./types').MasterCategory>(`${API_VERSION}/categories`, createData);
    // Convert back to Category format
    return {
      id: result.id.toString(),
      name: result.category_name,
      type: 'income' as const,
      description: result.description,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  },
  update: async (id: string, data: Partial<Omit<import('./types').Category, 'id' | 'created_at' | 'updated_at'>>) => {
    // Convert legacy Category format to MasterCategory format
    const updateData: import('./types').UpdateMasterCategoryParam = {
      category_name: data.name || '',
      description: data.description,
    };
    const result = await api.put<import('./types').MasterCategory>(`${API_VERSION}/categories/${id}`, updateData);
    // Convert back to Category format
    return {
      id: result.id.toString(),
      name: result.category_name,
      type: 'income' as const,
      description: result.description,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  },
  delete: async (id: string) => {
    return api.delete<{ message: string }>(`${API_VERSION}/categories/${id}`);
  },
};

export const paymentMethodsApi = {
  getAll: async () => {
    return api.get<Array<import('./types').PaymentMethod>>('/payment-methods');
  },
  create: async (data: Omit<import('./types').PaymentMethod, 'id' | 'created_at' | 'updated_at'>) => {
    return api.post<import('./types').PaymentMethod>('/payment-methods', data);
  },
  update: async (id: string, data: Partial<Omit<import('./types').PaymentMethod, 'id' | 'created_at' | 'updated_at'>>) => {
    return api.put<import('./types').PaymentMethod>(`/payment-methods/${id}`, data);
  },
  delete: async (id: string) => {
    return api.delete<{ message: string }>(`/payment-methods/${id}`);
  },
};

export const accountsApi = {
  getAll: async () => {
    return api.get<Array<import('./types').Account>>('/accounts');
  },
  create: async (data: Omit<import('./types').Account, 'id' | 'created_at' | 'updated_at'>) => {
    return api.post<import('./types').Account>('/accounts', data);
  },
  update: async (id: string, data: Partial<Omit<import('./types').Account, 'id' | 'created_at' | 'updated_at'>>) => {
    return api.put<import('./types').Account>(`/accounts/${id}`, data);
  },
  delete: async (id: string) => {
    return api.delete<{ message: string }>(`/accounts/${id}`);
  },
};

// Master Category Management (Hierarchical Categories)
export const masterCategoryApi = {
  getTree: async () => {
    return api.get<Array<import('./types').MasterCategoryTree>>(`${API_VERSION}/categories/tree`);
  },
  getAll: async (page: number = 1, limit: number = 10, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    return api.get<import('./types').PaginatedResponse<import('./types').MasterCategory>>(
      `${API_VERSION}/categories?${params.toString()}`
    );
  },
  create: async (data: import('./types').CreateMasterCategoryParam) => {
    return api.post<import('./types').MasterCategory>(`${API_VERSION}/categories`, data);
  },
  update: async (id: number, data: import('./types').UpdateMasterCategoryParam) => {
    return api.put<import('./types').MasterCategory>(`${API_VERSION}/categories/${id}`, data);
  },
  delete: async (id: number) => {
    return api.delete<{ message: string }>(`${API_VERSION}/categories/${id}`);
  },
};

export { ApiError };

