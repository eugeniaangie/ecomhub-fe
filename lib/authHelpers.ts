// Auth helper functions and hooks

import { authApi, ApiError } from './api';
import { auth } from './auth';
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
      const roles = JSON.parse(rolesStr);
      // Debug: log roles to help troubleshoot
      if (process.env.NODE_ENV === 'development') {
        console.log('[getUserRoles] Roles from localStorage:', roles);
      }
      return roles;
    } catch {
      return [];
    }
  }
  
  // Fallback: check if user_role exists (backward compatibility)
  const role = localStorage.getItem('user_role');
  if (role) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[getUserRoles] Fallback to user_role:', role);
    }
    return [role];
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.warn('[getUserRoles] No roles found in localStorage');
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
  const hasRole = requiredRoles.some(role => userRoles.includes(role));
  if (process.env.NODE_ENV === 'development') {
    console.log('[hasAnyRole]', { userRoles, requiredRoles, hasRole });
  }
  return hasRole;
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
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can update category
 * Allowed: superadmin, admin
 */
export const canUpdateCategory = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can delete category
 * Allowed: superadmin, admin
 */
export const canDeleteCategory = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can create fiscal period
 * Allowed: superadmin, admin, manager
 */
export const canCreateFiscalPeriod = (): boolean => {
  return hasAnyRole(['superadmin', 'admin', 'manager']);
};

/**
 * Check if user can update fiscal period
 * Allowed: superadmin, admin, manager
 */
export const canUpdateFiscalPeriod = (): boolean => {
  return hasAnyRole(['superadmin', 'admin', 'manager']);
};

/**
 * Check if user can delete fiscal period
 * Allowed: superadmin, admin
 */
export const canDeleteFiscalPeriod = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can close fiscal period
 * Allowed: superadmin, admin, manager
 */
export const canCloseFiscalPeriod = (): boolean => {
  return hasAnyRole(['superadmin', 'admin', 'manager']);
};

/**
 * Check if user can reopen fiscal period
 * Allowed: superadmin only
 */
export const canReopenFiscalPeriod = (): boolean => {
  return hasRole('superadmin');
};

/**
 * Check if user can create operational expense
 * Allowed: all authenticated users (superadmin, admin, manager, staff, viewer)
 */
export const canCreateOperationalExpense = (): boolean => {
  // All authenticated users can create
  return true;
};

/**
 * Check if user can update operational expense
 * Allowed: all authenticated users (if status is pending)
 */
export const canUpdateOperationalExpense = (expenseStatus: string): boolean => {
  // All authenticated users can update if status is pending
  return expenseStatus === 'pending';
};

/**
 * Check if user can delete operational expense
 * Allowed: all authenticated users (if status is pending)
 */
export const canDeleteOperationalExpense = (expenseStatus: string): boolean => {
  // All authenticated users can delete if status is pending
  return expenseStatus === 'pending';
};

/**
 * Check if user can approve operational expense
 * Allowed: superadmin, admin (if pending)
 */
export const canApproveOperationalExpense = (expenseStatus: string): boolean => {
  return expenseStatus === 'pending' && hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can reject operational expense
 * Allowed: superadmin, admin (if pending)
 */
export const canRejectOperationalExpense = (expenseStatus: string): boolean => {
  return expenseStatus === 'pending' && hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can pay operational expense
 * Allowed: superadmin, admin (if approved)
 */
export const canPayOperationalExpense = (expenseStatus: string): boolean => {
  return expenseStatus === 'approved' && hasAnyRole(['superadmin', 'admin']);
};

/**
 * Legacy function - use canApproveOperationalExpense instead
 */
export const canApproveExpense = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Legacy function - use canRejectOperationalExpense instead
 */
export const canRejectExpense = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Legacy function - use canPayOperationalExpense instead
 */
export const canPayExpense = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can create journal entry
 * Allowed: superadmin, admin
 */
export const canCreateJournalEntry = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can update journal entry
 * Allowed: superadmin, admin (if draft)
 */
export const canUpdateJournalEntry = (entryStatus: string): boolean => {
  return entryStatus === 'draft' && hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can delete journal entry
 * Allowed: superadmin, admin (if draft)
 */
export const canDeleteJournalEntry = (entryStatus: string): boolean => {
  return entryStatus === 'draft' && hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can approve journal entry
 * Allowed: superadmin, admin (if draft)
 */
export const canApproveJournalEntry = (entryStatus?: string): boolean => {
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
  return hasAnyRole(['superadmin', 'admin', 'manager']);
};

/**
 * Check if user can update ad budget
 * Allowed: superadmin, admin, manager
 */
export const canUpdateAdBudget = (): boolean => {
  return hasAnyRole(['superadmin', 'admin', 'manager']);
};

/**
 * Check if user can update ad budget spent amount
 * Allowed: superadmin, admin, manager
 */
export const canUpdateAdBudgetSpent = (): boolean => {
  return hasAnyRole(['superadmin', 'admin', 'manager']);
};

/**
 * Check if user can delete ad budget
 * Allowed: superadmin, admin
 */
export const canDeleteAdBudget = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can create capital investor
 * Allowed: superadmin, admin
 */
export const canCreateCapitalInvestor = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can update capital investor
 * Allowed: superadmin, admin
 */
export const canUpdateCapitalInvestor = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can update capital investor return paid
 * Allowed: superadmin, admin
 */
export const canUpdateCapitalInvestorReturnPaid = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can update capital investor status
 * Allowed: superadmin, admin
 */
export const canUpdateCapitalInvestorStatus = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can delete capital investor
 * Allowed: superadmin, admin
 */
export const canDeleteCapitalInvestor = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can create expense category
 * Allowed: superadmin, admin
 */
export const canCreateExpenseCategory = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can update expense category
 * Allowed: superadmin, admin
 */
export const canUpdateExpenseCategory = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can delete expense category
 * Allowed: superadmin, admin
 */
export const canDeleteExpenseCategory = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can create account
 * Allowed: superadmin, admin
 */
export const canCreateAccount = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can update account
 * Allowed: superadmin, admin
 */
export const canUpdateAccount = (): boolean => {
  return hasAnyRole(['superadmin', 'admin']);
};

/**
 * Check if user can delete account
 * Allowed: superadmin, admin
 */
export const canDeleteAccount = (): boolean => {
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
 * Logout user - calls logout API and clears auth token
 */
export const logout = async (): Promise<void> => {
  try {
    await authApi.logout();
  } catch (error) {
    // Handle expected errors after logout (token revoked is normal)
    if (error instanceof ApiError && 
        error.status === 403 && 
        (error.message?.toLowerCase().includes('token has been revoked') ||
         (error.data as { business_code?: string })?.business_code === '93')) {
      // Token already revoked - this is expected, just clear local data
      // Don't log as error since this is normal behavior
    } else {
      // Other errors - log but still proceed with clearing local data
      console.warn('Logout API error:', error);
    }
  } finally {
    // Always clear token and user data from local storage
    auth.clearToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
    }
  }
};

