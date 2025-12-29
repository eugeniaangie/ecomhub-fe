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
  AdBudget,
  CreateAdBudget,
  UpdateAdBudget,
  UpdateAdBudgetSpent,
  CapitalInvestor,
  CreateCapitalInvestor,
  UpdateCapitalInvestor,
  UpdateReturnPaid,
  UpdateInvestorStatus,
  TotalInvestment,
  JournalEntry,
  CreateJournalEntry,
  UpdateJournalEntry,
  PaginatedResponseFinance,
  CurrentBalanceResponse,
  AdExpensesResponse,
  FinanceTransaction,
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

// ===== Ad Budgets =====
export const adBudgetsApi = {
  /**
   * Get paginated list of ad budgets with filters
   */
  getList: async (params: {
    page: number;
    limit: number;
    search?: string;
    platform?: string;
    month_year?: string;
  }) => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });
    if (params.search) queryParams.append('search', params.search);
    if (params.platform) queryParams.append('platform', params.platform);
    if (params.month_year) queryParams.append('month_year', params.month_year);

    return api.get<PaginatedResponseFinance<AdBudget>>(
      `${API_VERSION}/ad-budgets?${queryParams.toString()}`
    );
  },

  /**
   * Get all budgets for a specific month
   */
  getByMonth: async (monthYear: string) => {
    return api.get<AdBudget[]>(`${API_VERSION}/ad-budgets/month/${monthYear}`);
  },

  /**
   * Get single ad budget by ID
   */
  getById: async (id: number) => {
    return api.get<AdBudget>(`${API_VERSION}/ad-budgets/${id}`);
  },

  /**
   * Create new ad budget
   */
  create: async (data: CreateAdBudget) => {
    return api.post<AdBudget>(`${API_VERSION}/ad-budgets`, data);
  },

  /**
   * Update ad budget
   */
  update: async (id: number, data: UpdateAdBudget) => {
    return api.put<AdBudget>(`${API_VERSION}/ad-budgets/${id}`, data);
  },

  /**
   * Update spent amount only
   */
  updateSpent: async (id: number, data: UpdateAdBudgetSpent) => {
    return api.patch<AdBudget>(`${API_VERSION}/ad-budgets/${id}/spent`, data);
  },

  /**
   * Delete ad budget
   */
  delete: async (id: number) => {
    return api.delete<{ message: string }>(`${API_VERSION}/ad-budgets/${id}`);
  },
};

// ===== Capital Investors =====
export const capitalInvestorsApi = {
  /**
   * Get paginated list of capital investors
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

    return api.get<PaginatedResponseFinance<CapitalInvestor>>(
      `${API_VERSION}/capital-investors?${queryParams.toString()}`
    );
  },

  /**
   * Get all capital investors (for dropdown)
   */
  getAll: async () => {
    return api.get<CapitalInvestor[]>(`${API_VERSION}/capital-investors/no_page`);
  },

  /**
   * Get total investment summary
   * API returns either a number (total_investment) or an object
   */
  getTotal: async () => {
    return api.get<TotalInvestment | number>(`${API_VERSION}/capital-investors/total`);
  },

  /**
   * Get single capital investor by ID
   */
  getById: async (id: number) => {
    return api.get<CapitalInvestor>(`${API_VERSION}/capital-investors/${id}`);
  },

  /**
   * Create new capital investor
   */
  create: async (data: CreateCapitalInvestor) => {
    return api.post<CapitalInvestor>(`${API_VERSION}/capital-investors`, data);
  },

  /**
   * Update capital investor
   */
  update: async (id: number, data: UpdateCapitalInvestor) => {
    return api.put<CapitalInvestor>(`${API_VERSION}/capital-investors/${id}`, data);
  },

  /**
   * Update return paid amount
   */
  updateReturnPaid: async (id: number, data: UpdateReturnPaid) => {
    return api.patch<CapitalInvestor>(`${API_VERSION}/capital-investors/${id}/return-paid`, data);
  },

  /**
   * Update investor status
   */
  updateStatus: async (id: number, data: UpdateInvestorStatus) => {
    return api.patch<CapitalInvestor>(`${API_VERSION}/capital-investors/${id}/status`, data);
  },

  /**
   * Delete capital investor
   */
  delete: async (id: number) => {
    return api.delete<{ message: string }>(`${API_VERSION}/capital-investors/${id}`);
  },
};

// ===== Journal Entries =====
export const journalEntriesApi = {
  /**
   * Get paginated list of journal entries with filters
   */
  getList: async (params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    fiscal_period_id?: number;
  }) => {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
    });
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.fiscal_period_id) queryParams.append('fiscal_period_id', params.fiscal_period_id.toString());

    return api.get<PaginatedResponseFinance<JournalEntry>>(
      `${API_VERSION}/journal-entries?${queryParams.toString()}`
    );
  },

  /**
   * Get single journal entry by ID (includes lines)
   */
  getById: async (id: number) => {
    return api.get<JournalEntry>(`${API_VERSION}/journal-entries/${id}`);
  },

  /**
   * Create new journal entry
   */
  create: async (data: CreateJournalEntry) => {
    return api.post<JournalEntry>(`${API_VERSION}/journal-entries`, data);
  },

  /**
   * Update journal entry (only if status = draft)
   */
  update: async (id: number, data: UpdateJournalEntry) => {
    return api.put<JournalEntry>(`${API_VERSION}/journal-entries/${id}`, data);
  },

  /**
   * Delete journal entry (only if status = draft)
   */
  delete: async (id: number) => {
    return api.delete<{ message: string }>(`${API_VERSION}/journal-entries/${id}`);
  },

  /**
   * Approve journal entry (Admin only)
   */
  approve: async (id: number) => {
    return api.post<JournalEntry>(`${API_VERSION}/journal-entries/${id}/approve`, {});
  },

  /**
   * Reject journal entry (Admin only)
   */
  reject: async (id: number) => {
    return api.post<JournalEntry>(`${API_VERSION}/journal-entries/${id}/reject`, {});
  },

  /**
   * Post journal entry to accounts (Admin only)
   */
  post: async (id: number) => {
    return api.post<JournalEntry>(`${API_VERSION}/journal-entries/${id}/post`, {});
  },
};

// ===== Finance Reports =====
export const financeReportsApi = {
  /**
   * Get current balance with transactions
   */
  getCurrentBalance: async (params?: {
    account_id?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.account_id) queryParams.append('account_id', params.account_id.toString());
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    const queryString = queryParams.toString();
    return api.get<CurrentBalanceResponse>(
      `${API_VERSION}/reports/dashboard/finance/current-balance${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get all Neobank transactions
   */
  getTransactions: async (params?: {
    account_id?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.account_id) queryParams.append('account_id', params.account_id.toString());
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    const queryString = queryParams.toString();
    return api.get<FinanceTransaction[]>(
      `${API_VERSION}/reports/dashboard/finance/transactions${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * Get ad expenses
   */
  getAdExpenses: async (params?: {
    account_id?: number;
    start_date?: string;
    end_date?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.account_id) queryParams.append('account_id', params.account_id.toString());
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    const queryString = queryParams.toString();
    return api.get<AdExpensesResponse>(
      `${API_VERSION}/reports/dashboard/finance/ad-expenses${queryString ? `?${queryString}` : ''}`
    );
  },
};

