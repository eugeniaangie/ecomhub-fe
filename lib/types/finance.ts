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

export type UpdateFiscalPeriod = CreateFiscalPeriod;

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

export type UpdateExpenseCategory = CreateExpenseCategory;

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

export type UpdateAccount = CreateAccount;

// ===== Operational Expenses =====
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid';
export type Channel = 'shopee' | 'tiktok' | 'general' | 'lazada' | 'blibli';

export interface OperationalExpense {
  id: number;
  expense_number: string;  // Auto-generated: EXP-YYYY-NNNN
  expense_date: string;
  expense_category_id: number;
  account_id: number;
  amount: number;
  description?: string;
  receipt_image_url?: string;
  channel: Channel;
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
  channel: Channel;
}

export type UpdateOperationalExpense = CreateOperationalExpense;

// ===== Pagination =====
export interface PaginatedResponseFinance<T> {
  page: number;
  limit: number;
  total_results: number;
  total_pages: number;
  results: T[];
}

// ===== Ad Budgets =====
export type AdPlatform = 'meta_ads' | 'google_ads' | 'tiktok_ads' | 'shopee_ads' | 'lazada_ads' | 'blibli_ads';

export interface AdBudget {
  id: number;
  platform: AdPlatform;
  month_year: string; // YYYY-MM-01 format
  budget_amount: number;
  spent_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateAdBudget {
  platform: AdPlatform;
  month_year: string; // YYYY-MM-01
  budget_amount: number;
  spent_amount?: number;
  notes?: string;
}

export interface UpdateAdBudget {
  platform?: string;
  month_year?: string;
  budget_amount?: number;
  spent_amount?: number;
  notes?: string;
}

export interface UpdateAdBudgetSpent {
  spent_amount: number;
}

// ===== Capital Investors =====
export type InvestmentType = 'equity' | 'debt' | 'convertible_note' | 'grant';
export type InvestorStatus = 'active' | 'fully_paid' | 'defaulted' | 'cancelled';

export interface CapitalInvestor {
  id: number;
  investor_name: string;
  investment_type: InvestmentType;
  amount: number;
  investment_date: string;
  return_percentage?: number;
  maturity_date?: string;
  return_paid: number;
  contract_document_url?: string;
  notes?: string;
  status: InvestorStatus;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateCapitalInvestor {
  investor_name: string;
  investment_type: InvestmentType;
  amount: number;
  investment_date: string; // YYYY-MM-DD
  return_percentage?: number;
  maturity_date?: string; // YYYY-MM-DD
  contract_document_url?: string;
  notes?: string;
}

export interface UpdateCapitalInvestor {
  investor_name?: string;
  investment_type?: InvestmentType;
  amount?: number;
  investment_date?: string;
  return_percentage?: number;
  maturity_date?: string;
  contract_document_url?: string;
  notes?: string;
}

export interface UpdateReturnPaid {
  return_paid: number;
}

export interface UpdateInvestorStatus {
  status: InvestorStatus;
}

export interface TotalInvestment {
  total_amount: number;
  total_return_paid: number;
  total_remaining: number;
}

// ===== Journal Entries =====
export type JournalEntryStatus = 'draft' | 'approved' | 'rejected' | 'posted';

export interface JournalEntryLine {
  id?: number;
  account_id: number;
  description: string;
  debit: number;
  credit: number;
  // Relations
  account?: Account;
}

export interface JournalEntry {
  id: number;
  entry_number: string; // Auto-generated: JE-000001
  entry_date: string;
  fiscal_period_id: number;
  description: string;
  reference_number?: string;
  channel: Channel;
  status: JournalEntryStatus;
  total_debit: number;
  total_credit: number;
  approved_by?: number;
  approved_at?: string;
  posted_by?: number;
  posted_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  // Relations
  fiscal_period?: FiscalPeriod;
  lines?: JournalEntryLine[];
}

export interface CreateJournalEntry {
  entry_date: string; // YYYY-MM-DD
  fiscal_period_id: number;
  description: string;
  reference_number?: string;
  channel: Channel;
  lines: Omit<JournalEntryLine, 'id' | 'account'>[];
}

export type UpdateJournalEntry = CreateJournalEntry;

// ===== User Roles =====
export type UserRole = 'staff' | 'admin' | 'superadmin' | 'manager' | 'viewer';

// ===== Finance Reports =====
export interface FinanceTransaction {
  journal_entry_id: number;
  entry_number: string;
  entry_date: string; // ISO datetime
  entry_description: string;
  reference_number?: string | null;
  neobank_debit: number;
  neobank_credit: number;
  line_description: string;
  partner_account_code: string;
  partner_account_name: string;
  partner_account_type: string;
  partner_amount: number;
  status: string;
}

// New API Response Types
export interface AccountTransactionBalance {
  account_name: string;
  total_debit: number;
  total_credit: number;
  current_balance: number;
}

export interface PartnerAccount {
  account_code: string;
  account_name: string;
  account_type: string;
  amount: number;
  description: string;
}

export interface AccountTransaction {
  account_name: string;
  account_code: string;
  journal_entry_id: number;
  entry_number: string;
  entry_date: string; // ISO 8601 format
  entry_description: string;
  reference_number?: string | null;
  account_debit: number;
  account_credit: number;
  net_amount: number;
  line_description: string;
  partner_accounts: PartnerAccount[];
  status: string;
}

export interface AdExpenses {
  total_ad_expense: number;
  total_transactions: number;
  account_count: number;
}

// Legacy types (for backward compatibility)
export interface CurrentBalanceResponse {
  total_debit: number;
  total_credit: number;
  current_balance: number;
  transactions: FinanceTransaction[];
}

export interface AdExpensesResponse {
  total_ad_expense: number;
  transactions: FinanceTransaction[];
}

