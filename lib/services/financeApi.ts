// Finance API Services

import { api } from '../api';
import type {
  FiscalPeriod,
  CreateFiscalPeriod,
  UpdateFiscalPeriod,
  ExpenseCategory,
  CreateExpenseCategory,
  UpdateExpenseCategory,
  Account,
  CreateAccount,
  UpdateAccount,
  OperationalExpense,
  CreateOperationalExpense,
  UpdateOperationalExpense,
  PaginatedResponseFinance,
} from '../types/finance';

const API_VERSION = '/api/v1';

// ===== Fiscal Periods =====
export const fiscalPeriodsApi = {
  /**
   * Get paginated list of fiscal periods
   */
  getList: async (params: {
    page: number;
    limit: number;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });
    if (params.search) queryParams.append('search', params.search);
    
    return api.get<PaginatedResponseFinance<FiscalPeriod>>(
      `${API_VERSION}/fiscal-periods?${queryParams.toString()}`
    );
  },

  /**
   * Get all fiscal periods (for dropdown)
   */
  getAll: async () => {
    return api.get<FiscalPeriod[]>(`${API_VERSION}/fiscal-periods/no_page`);
  },

  /**
   * Get single fiscal period by ID
   */
  getById: async (id: number) => {
    return api.get<FiscalPeriod>(`${API_VERSION}/fiscal-periods/${id}`);
  },

  /**
   * Create new fiscal period
   */
  create: async (data: CreateFiscalPeriod) => {
    return api.post<FiscalPeriod>(`${API_VERSION}/fiscal-periods`, data);
  },

  /**
   * Update fiscal period
   */
  update: async (id: number, data: UpdateFiscalPeriod) => {
    return api.put<FiscalPeriod>(`${API_VERSION}/fiscal-periods/${id}`, data);
  },

  /**
   * Delete fiscal period
   */
  delete: async (id: number) => {
    return api.delete<{ message: string }>(`${API_VERSION}/fiscal-periods/${id}`);
  },

  /**
   * Close fiscal period (Admin only)
   */
  close: async (id: number) => {
    return api.post<FiscalPeriod>(`${API_VERSION}/fiscal-periods/${id}/close`, {});
  },

  /**
   * Reopen fiscal period (Superadmin only)
   */
  reopen: async (id: number) => {
    return api.post<FiscalPeriod>(`${API_VERSION}/fiscal-periods/${id}/reopen`, {});
  },
};

// ===== Expense Categories =====
export const expenseCategoriesApi = {
  /**
   * Get paginated list of expense categories
   */
  getList: async (params: {
    page: number;
    limit: number;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });
    if (params.search) queryParams.append('search', params.search);
    
    return api.get<PaginatedResponseFinance<ExpenseCategory>>(
      `${API_VERSION}/expense-categories?${queryParams.toString()}`
    );
  },

  /**
   * Get all expense categories (for dropdown)
   */
  getAll: async () => {
    return api.get<ExpenseCategory[]>(`${API_VERSION}/expense-categories/no_page`);
  },

  /**
   * Get single expense category by ID
   */
  getById: async (id: number) => {
    return api.get<ExpenseCategory>(`${API_VERSION}/expense-categories/${id}`);
  },

  /**
   * Create new expense category
   */
  create: async (data: CreateExpenseCategory) => {
    return api.post<ExpenseCategory>(`${API_VERSION}/expense-categories`, data);
  },

  /**
   * Update expense category
   */
  update: async (id: number, data: UpdateExpenseCategory) => {
    return api.put<ExpenseCategory>(`${API_VERSION}/expense-categories/${id}`, data);
  },

  /**
   * Delete expense category
   */
  delete: async (id: number) => {
    return api.delete<{ message: string }>(`${API_VERSION}/expense-categories/${id}`);
  },
};

// ===== Chart of Accounts =====
export const accountsFinanceApi = {
  /**
   * Get paginated list of accounts with filters
   */
  getList: async (params: {
    page: number;
    limit: number;
    search?: string;
    account_type?: string;
  }) => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });
    if (params.search) queryParams.append('search', params.search);
    if (params.account_type) queryParams.append('account_type', params.account_type);
    
    return api.get<PaginatedResponseFinance<Account>>(
      `${API_VERSION}/accounts?${queryParams.toString()}`
    );
  },

  /**
   * Get all active accounts (for dropdown)
   */
  getAll: async () => {
    return api.get<Account[]>(`${API_VERSION}/accounts/no_page`);
  },

  /**
   * Get accounts by type
   */
  getByType: async (type: string) => {
    return api.get<Account[]>(`${API_VERSION}/accounts/type/${type}`);
  },

  /**
   * Get children accounts of a parent
   */
  getChildren: async (parentId: number) => {
    return api.get<Account[]>(`${API_VERSION}/accounts/parent/${parentId}`);
  },

  /**
   * Get single account by ID
   */
  getById: async (id: number) => {
    return api.get<Account>(`${API_VERSION}/accounts/${id}`);
  },

  /**
   * Create new account
   */
  create: async (data: CreateAccount) => {
    return api.post<Account>(`${API_VERSION}/accounts`, data);
  },

  /**
   * Update account
   */
  update: async (id: number, data: UpdateAccount) => {
    return api.put<Account>(`${API_VERSION}/accounts/${id}`, data);
  },

  /**
   * Delete account (soft delete)
   */
  delete: async (id: number) => {
    return api.delete<{ message: string }>(`${API_VERSION}/accounts/${id}`);
  },
};

// ===== Operational Expenses =====
export const operationalExpensesApi = {
  /**
   * Get paginated list of operational expenses with filters
   */
  getList: async (params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    category_id?: number;
  }) => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.category_id) queryParams.append('category_id', params.category_id.toString());
    
    return api.get<PaginatedResponseFinance<OperationalExpense>>(
      `${API_VERSION}/operational-expenses?${queryParams.toString()}`
    );
  },

  /**
   * Get single operational expense by ID
   */
  getById: async (id: number) => {
    return api.get<OperationalExpense>(`${API_VERSION}/operational-expenses/${id}`);
  },

  /**
   * Create new operational expense
   */
  create: async (data: CreateOperationalExpense) => {
    return api.post<OperationalExpense>(`${API_VERSION}/operational-expenses`, data);
  },

  /**
   * Update operational expense (only if status = pending)
   */
  update: async (id: number, data: UpdateOperationalExpense) => {
    return api.put<OperationalExpense>(`${API_VERSION}/operational-expenses/${id}`, data);
  },

  /**
   * Delete operational expense (only if status = pending)
   */
  delete: async (id: number) => {
    return api.delete<{ message: string }>(`${API_VERSION}/operational-expenses/${id}`);
  },

  /**
   * Approve operational expense (Admin only)
   */
  approve: async (id: number) => {
    return api.post<OperationalExpense>(`${API_VERSION}/operational-expenses/${id}/approve`, {});
  },

  /**
   * Reject operational expense (Admin only)
   */
  reject: async (id: number) => {
    return api.post<OperationalExpense>(`${API_VERSION}/operational-expenses/${id}/reject`, {});
  },

  /**
   * Mark operational expense as paid (Admin only)
   */
  pay: async (id: number) => {
    return api.post<OperationalExpense>(`${API_VERSION}/operational-expenses/${id}/pay`, {});
  },
};

