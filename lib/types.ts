// Type definitions matching backend Swagger/OpenAPI schemas

export interface ApiResponse<T> {
  status: 'success' | 'error';
  code: number;
  message: string;
  data: T;
  business_code?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

// Auth Me Response
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string | null;
  is_active: boolean;
  last_login: string;
}

export interface GetMeResponse {
  user: UserInfo;
  roles: string[];
}

// Master Category (Hierarchical)
export interface MasterCategory {
  id: number;
  category_name: string;
  description?: string;
  parent_id?: number;
  created_at?: string;
  created_by?: number;
  updated_at?: string;
  updated_by?: number;
}

export interface MasterCategoryTree {
  id: number;
  category_name: string;
  parent_id?: number;
  children?: MasterCategoryTree[];
}

export interface CreateMasterCategoryParam {
  category_name: string;
  description?: string;
  parent_id?: number | null;
}

export interface UpdateMasterCategoryParam {
  category_name: string;
  description?: string;
  parent_id?: number | null;
}

export interface PaginatedResponse<T> {
  page: number;
  limit: number;
  total_results: number;
  total_pages: number;
  results: T[];
}
