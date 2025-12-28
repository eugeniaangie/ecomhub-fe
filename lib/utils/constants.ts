// Constants for Finance Management

import type {
  AccountType,
  ExpenseStatus,
  InvestmentType,
  InvestorStatus,
  JournalEntryStatus,
} from '../types/finance';

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

// ===== Investment Types =====
export const INVESTMENT_TYPE_COLORS: Record<InvestmentType, string> = {
  equity: 'bg-blue-100 text-blue-800',
  debt: 'bg-red-100 text-red-800',
  convertible_note: 'bg-purple-100 text-purple-800',
  grant: 'bg-green-100 text-green-800',
};

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  equity: 'Equity',
  debt: 'Debt',
  convertible_note: 'Convertible Note',
  grant: 'Grant',
};

export const INVESTMENT_TYPE_OPTIONS: Array<{ value: InvestmentType; label: string }> = [
  { value: 'equity', label: 'Equity' },
  { value: 'debt', label: 'Debt' },
  { value: 'convertible_note', label: 'Convertible Note' },
  { value: 'grant', label: 'Grant' },
];

// ===== Investor Status =====
export const INVESTOR_STATUS_COLORS: Record<InvestorStatus, string> = {
  active: 'bg-green-100 text-green-800',
  fully_paid: 'bg-blue-100 text-blue-800',
  defaulted: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export const INVESTOR_STATUS_LABELS: Record<InvestorStatus, string> = {
  active: 'Active',
  fully_paid: 'Fully Paid',
  defaulted: 'Defaulted',
  cancelled: 'Cancelled',
};

export const INVESTOR_STATUS_OPTIONS: Array<{ value: InvestorStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'fully_paid', label: 'Fully Paid' },
  { value: 'defaulted', label: 'Defaulted' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ===== Journal Entry Status =====
export const JOURNAL_ENTRY_STATUS_COLORS: Record<JournalEntryStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  posted: 'bg-blue-100 text-blue-800',
};

export const JOURNAL_ENTRY_STATUS_LABELS: Record<JournalEntryStatus, string> = {
  draft: 'Draft',
  approved: 'Approved',
  rejected: 'Rejected',
  posted: 'Posted',
};

export const JOURNAL_ENTRY_STATUS_OPTIONS: Array<{ value: JournalEntryStatus | ''; label: string }> = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'posted', label: 'Posted' },
];

// ===== Ad Budget Platforms =====
export const AD_PLATFORM_OPTIONS = [
  'Facebook Ads',
  'Google Ads',
  'Instagram Ads',
  'TikTok Ads',
  'LinkedIn Ads',
  'Twitter Ads',
  'YouTube Ads',
  'Other',
];

