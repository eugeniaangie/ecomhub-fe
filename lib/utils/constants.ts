// Constants for Finance Management

import type { AccountType, ExpenseStatus } from '../types/finance';

// Account Type Colors
export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  asset: 'bg-blue-100 text-blue-800',
  liability: 'bg-red-100 text-red-800',
  equity: 'bg-purple-100 text-purple-800',
  revenue: 'bg-green-100 text-green-800',
  expense: 'bg-orange-100 text-orange-800',
  contra_asset: 'bg-gray-100 text-gray-800',
  contra_liability: 'bg-gray-100 text-gray-800',
};

// Account Type Labels
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expense',
  contra_asset: 'Contra Asset',
  contra_liability: 'Contra Liability',
};

// Expense Status Colors
export const EXPENSE_STATUS_COLORS: Record<ExpenseStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
};

// Expense Status Labels
export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
};

// Fiscal Period Status
export const FISCAL_PERIOD_STATUS_COLORS = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-red-100 text-red-800',
};

// Account Types Options for Select
export const ACCOUNT_TYPE_OPTIONS: Array<{ value: AccountType; label: string }> = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'equity', label: 'Equity' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'expense', label: 'Expense' },
  { value: 'contra_asset', label: 'Contra Asset' },
  { value: 'contra_liability', label: 'Contra Liability' },
];

// Expense Status Options for Filter
export const EXPENSE_STATUS_OPTIONS: Array<{ value: ExpenseStatus | ''; label: string }> = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'paid', label: 'Paid' },
];

