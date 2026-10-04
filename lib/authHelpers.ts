// Auth helper functions and hooks

import { authApi, ApiError } from './api';
import { auth } from './auth';
import { canMutateTenantData, clearTenantData } from './tenant';
import { UserRole } from './types/finance';

/**
 * Get current user roles from localStorage
 * Returns array of roles (e.g., ["manager", "admin"])
 */
export const getUserRoles = (): string[] => {
  if (typeof window === 'undefined') return [];

  const rolesStr = localStorage.getItem('user_roles');
  if (rolesStr) {
    try {
      return JSON.parse(rolesStr);
    } catch {
      return [];
    }
  }

  // Fallback: check if user_role exists (backward compatibility)
  const role = localStorage.getItem('user_role');
  if (role) {
    return [role];
  }

  return [];
};

/**
 * Get current user role from localStorage or auth context
 * Returns the first role or 'staff' as default
 * TODO: Replace with actual auth context when implemented
 */
export const getUserRole = (): UserRole => {
  if (typeof window === 'undefined') return 'staff';
  
  const roles = getUserRoles();
  if (roles.length > 0) {
    const role = roles[0];
    if (role === 'admin' || role === 'superadmin' || role === 'staff' || role === 'manager' || role === 'viewer') {
      return role as UserRole;
    }
  }
  
  // Fallback to localStorage for backward compatibility
  const role = localStorage.getItem('user_role');
  if (role === 'admin' || role === 'superadmin' || role === 'staff' || role === 'manager' || role === 'viewer') {
    return role as UserRole;
  }
  return 'staff';
};

/**
 * Get current user ID from localStorage or auth context
 * TODO: Replace with actual auth context when implemented
 */
export const getCurrentUserId = (): number => {
  if (typeof window === 'undefined') return 0;
  
  const userId = localStorage.getItem('user_id');
  return userId ? parseInt(userId) : 0;
};

/**
 * Set user roles in localStorage
 */
export const setUserRoles = (roles: string[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_roles', JSON.stringify(roles));
  
  // Also set first role for backward compatibility
  if (roles.length > 0) {
    localStorage.setItem('user_role', roles[0]);
  }
};

/**
 * Set user role in localStorage
 * TODO: Replace with actual auth context when implemented
 */
export const setUserRole = (role: UserRole): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_role', role);
  // Also update roles array
  setUserRoles([role]);
};

/**
 * Set user ID in localStorage
 * TODO: Replace with actual auth context when implemented
 */
export const setCurrentUserId = (userId: number): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_id', userId.toString());
};

/**
 * Check if user has a specific role
 */
export const hasRole = (role: string): boolean => {
  const roles = getUserRoles();
  return roles.includes(role);
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (requiredRoles: string[]): boolean => {
  const userRoles = getUserRoles();
  return requiredRoles.some((role) => userRoles.includes(role));
};

/**
 * Check if user has admin or superadmin role
 */
export const isAdmin = (): boolean => {
  const roles = getUserRoles();
  return roles.includes('admin') || roles.includes('superadmin');
};

/**
 * Check if user has superadmin role
 */
export const isSuperadmin = (): boolean => {
  return hasRole('superadmin');
};

/**
 * Check if user has manager role
 */
export const isManager = (): boolean => {
  return hasRole('manager');
};

// ===== Permission Check Functions =====
// Based on role permissions matrix

/**
 * Check if user can create category
 * Allowed: superadmin, admin
 */
export const canCreateCategory = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can update category
 * Allowed: superadmin, admin
 */
export const canUpdateCategory = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can delete category
 * Allowed: superadmin, admin
 */
export const canDeleteCategory = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can create fiscal period
 * Allowed: superadmin, admin, manager
 */
export const canCreateFiscalPeriod = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin', 'manager']);
};

/**
 * Check if user can update fiscal period
 * Allowed: superadmin, admin, manager
 */
export const canUpdateFiscalPeriod = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin', 'manager']);
};

/**
 * Check if user can delete fiscal period
 * Allowed: superadmin, admin
 */
export const canDeleteFiscalPeriod = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can close fiscal period
 * Allowed: superadmin, admin, manager
 */
export const canCloseFiscalPeriod = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin', 'manager']);
};

/**
 * Check if user can reopen fiscal period
 * Allowed: superadmin only
 */
export const canReopenFiscalPeriod = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasRole('superadmin');
};

/**
 * Check if user can create operational expense
 * Allowed: all authenticated users (superadmin, admin, manager, staff, viewer)
 */
export const canCreateOperationalExpense = (): boolean => {
  if (!canMutateTenantData()) return false;
  // All authenticated users with a tenant can create
  return true;
};

/**
 * Check if user can update operational expense
 * Allowed: all authenticated users (if status is pending)
 */
export const canUpdateOperationalExpense = (expenseStatus: string): boolean => {
  if (!canMutateTenantData()) return false;
  return expenseStatus === 'pending';
};

/**
 * Check if user can delete operational expense
 * Allowed: all authenticated users (if status is pending)
 */
export const canDeleteOperationalExpense = (expenseStatus: string): boolean => {
  if (!canMutateTenantData()) return false;
  return expenseStatus === 'pending';
};

/**
 * Check if user can approve operational expense
 * Allowed: superadmin, admin (if pending)
 */
export const canApproveOperationalExpense = (expenseStatus: string): boolean => {
  if (!canMutateTenantData()) return false;
  return expenseStatus === 'pending' && hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can reject operational expense
 * Allowed: superadmin, admin (if pending)
 */
export const canRejectOperationalExpense = (expenseStatus: string): boolean => {
  if (!canMutateTenantData()) return false;
  return expenseStatus === 'pending' && hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can pay operational expense
 * Allowed: superadmin, admin (if approved)
 */
export const canPayOperationalExpense = (expenseStatus: string): boolean => {
  if (!canMutateTenantData()) return false;
  return expenseStatus === 'approved' && hasAnyRole(['superadmin', 'admin']);
};

/**
 * Legacy function - use canApproveOperationalExpense instead
 */
export const canApproveExpense = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Legacy function - use canRejectOperationalExpense instead
 */
export const canRejectExpense = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Legacy function - use canPayOperationalExpense instead
 */
export const canPayExpense = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can create journal entry
 * Allowed: superadmin, admin
 */
export const canCreateJournalEntry = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can update journal entry
 * Allowed: superadmin (any status), admin (if draft)
 */
export const canUpdateJournalEntry = (entryStatus: string): boolean => {
  if (!canMutateTenantData()) return false;
  if (hasRole('superadmin')) return true;
  return entryStatus === 'draft' && hasRole('admin');
};

/**
 * Check if user can delete journal entry
 * Allowed: superadmin, admin (if draft)
 */
export const canDeleteJournalEntry = (entryStatus: string): boolean => {
  if (!canMutateTenantData()) return false;
  return entryStatus === 'draft' && hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can approve journal entry
 * Allowed: superadmin, admin (if draft)
 */
export const canApproveJournalEntry = (entryStatus?: string): boolean => {
  if (!canMutateTenantData()) return false;
  if (entryStatus !== undefined && entryStatus !== 'draft') {
    return false;
  }
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can reject journal entry
 * Allowed: superadmin, admin (if draft)
 */
export const canRejectJournalEntry = (entryStatus?: string): boolean => {
  if (!canMutateTenantData()) return false;
  if (entryStatus !== undefined && entryStatus !== 'draft') {
    return false;
  }
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can post journal entry
 * Allowed: superadmin, admin (if approved)
 */
export const canPostJournalEntry = (entryStatus?: string): boolean => {
  if (!canMutateTenantData()) return false;
  if (entryStatus !== undefined && entryStatus !== 'approved') {
    return false;
  }
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can create ad budget
 * Allowed: superadmin, admin, manager
 */
export const canCreateAdBudget = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin', 'manager']);
};

/**
 * Check if user can update ad budget
 * Allowed: superadmin, admin, manager
 */
export const canUpdateAdBudget = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin', 'manager']);
};

/**
 * Check if user can update ad budget spent amount
 * Allowed: superadmin, admin, manager
 */
export const canUpdateAdBudgetSpent = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin', 'manager']);
};

/**
 * Check if user can delete ad budget
 * Allowed: superadmin, admin
 */
export const canDeleteAdBudget = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can create capital investor
 * Allowed: superadmin, admin
 */
export const canCreateCapitalInvestor = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can update capital investor
 * Allowed: superadmin, admin
 */
export const canUpdateCapitalInvestor = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can update capital investor return paid
 * Allowed: superadmin, admin
 */
export const canUpdateCapitalInvestorReturnPaid = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can update capital investor status
 * Allowed: superadmin, admin
 */
export const canUpdateCapitalInvestorStatus = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can delete capital investor
 * Allowed: superadmin, admin
 */
export const canDeleteCapitalInvestor = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can create expense category
 * Allowed: superadmin, admin
 */
export const canCreateExpenseCategory = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can update expense category
 * Allowed: superadmin, admin
 */
export const canUpdateExpenseCategory = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can delete expense category
 * Allowed: superadmin, admin
 */
export const canDeleteExpenseCategory = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can create account
 * Allowed: superadmin, admin
 */
export const canCreateAccount = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can update account
 * Allowed: superadmin, admin
 */
export const canUpdateAccount = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can delete account
 * Allowed: superadmin, admin
 */
export const canDeleteAccount = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can view (all authenticated users can view)
 * Allowed: superadmin, admin, manager, staff, viewer
 */
export const canView = (): boolean => {
  // All authenticated users can view
  return true;
};

/**
 * Connect a Shopee shop via Partner OAuth (F6a / FE24).
 * Allowed: superadmin, admin — matches Core authorize-url gate.
 */
export const canConnectShopeeShop = (): boolean => {
  if (!canMutateTenantData()) return false;
  return hasAnyRole(['superadmin', 'admin']);
};

/** Superadmin may switch active tenant (FE32 / FE35). */
export const canSwitchTenant = (): boolean => {
  return isSuperadmin();
};

/** Superadmin Settings › Tenants (FE36). */
export const canManageTenants = (): boolean => {
  return isSuperadmin();
};

/** Superadmin Settings › Users — roles + membership (FE34 / FE35). */
export const canAssignTenantMembership = (): boolean => {
  return isSuperadmin();
};

/** Superadmin Settings › Users list / role edit. */
export const canManageUsers = (): boolean => {
  return isSuperadmin();
};

/**
 * Non-superadmin with at least one membership, or superadmin (all tenants).
 * Zero-membership non-superadmin → view-only (Decision 14).
 */
export const hasTenantMembership = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (isSuperadmin()) return true;
  return canMutateTenantData();
};

/** Alias — mutate creates/edits when tenant context allows it. */
export const canMutateInTenant = (): boolean => canMutateTenantData();

/**
 * Clear all client-side auth user keys (roles + id).
 * Call from logout and from global 401 / failed refresh paths.
 */
export const clearUserData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user_roles');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_id');
  clearTenantData();
};

/** Re-export for pages that gate creates without importing lib/tenant. */
export { canMutateTenantData };

/**
 * Logout user - calls logout API and clears auth token + roles
 */
export const logout = async (): Promise<void> => {
  try {
    await authApi.logout();
  } catch (error) {
    // Access may already be dead; refresh cookie revoke can still succeed via FE7 retry.
    // Revoked / unauthorized after logout is expected — still clear local state.
    if (
      error instanceof ApiError &&
      (error.status === 401 ||
        error.status === 403 ||
        (error.data as { business_code?: string })?.business_code === '93')
    ) {
      // expected
    } else {
      console.warn('Logout API error:', error);
    }
  } finally {
    auth.clearToken();
    clearUserData();
  }
};

