// Finance Management Types

// ===== Fiscal Periods =====
export interface FiscalPeriod {
  id: number;
  period_name: string;
  period_start: string; // ISO date
  period_end: string;   // ISO date
  is_closed: boolean;
  closed_at?: string;
  closed_by?: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateFiscalPeriod {
  period_name: string;
  period_start: string; // YYYY-MM-DD
  period_end: string;   // YYYY-MM-DD
}

export interface UpdateFiscalPeriod extends CreateFiscalPeriod {}

// ===== Expense Categories =====
export interface ExpenseCategory {
  id: number;
  category_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateExpenseCategory {
  category_name: string;
  description?: string;
}

export interface UpdateExpenseCategory extends CreateExpenseCategory {}

// ===== Chart of Accounts =====
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | 'contra_asset' | 'contra_liability';

export interface Account {
  id: number;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_account_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateAccount {
  account_code: string;
  account_name: string;
  account_type: AccountType;
  parent_account_id?: number;
  is_active?: boolean;
}

export interface UpdateAccount extends CreateAccount {}

// ===== Operational Expenses =====
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface OperationalExpense {
  id: number;
  expense_number: string;  // Auto-generated: EXP-YYYY-NNNN
  expense_date: string;
  expense_category_id: number;
  account_id: number;
  amount: number;
  description?: string;
  receipt_image_url?: string;
  status: ExpenseStatus;
  approved_by?: number;
  approved_at?: string;
  paid_by?: number;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  // Relations (might be populated)
  expense_category?: ExpenseCategory;
  account?: Account;
}

export interface CreateOperationalExpense {
  expense_date: string;     // YYYY-MM-DD
  expense_category_id: number;
  account_id: number;
  amount: number;
  description?: string;
  receipt_image_url?: string;
}

export interface UpdateOperationalExpense extends CreateOperationalExpense {}

// ===== Pagination =====
export interface PaginatedResponseFinance<T> {
  page: number;
  limit: number;
  total_results: number;
  total_pages: number;
  results: T[];
}

// ===== User Roles =====
export type UserRole = 'staff' | 'admin' | 'superadmin';

