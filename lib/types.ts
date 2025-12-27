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
  token: string;
  token_type?: string;
  expires_in?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

// Financial Records
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category_id: string;
  category?: Category;
  payment_method_id: string;
  payment_method?: PaymentMethod;
  account_id: string;
  account?: Account;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionCreate {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category_id: string;
  payment_method_id: string;
  account_id: string;
  date: string;
}

export interface TransactionUpdate extends Partial<TransactionCreate> {
  id: string;
}

// Master Data
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet';
  balance?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Dashboard
export interface DashboardSummary {
  total_income: number;
  total_expense: number;
  net_profit: number;
  period: string; // e.g., "2024-01"
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

