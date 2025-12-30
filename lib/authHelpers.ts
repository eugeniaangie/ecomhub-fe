// Auth helper functions and hooks

import { authApi, ApiError } from './api';
import { auth } from './auth';
import { UserRole } from './types/finance';

/**
 * Get current user role from localStorage or auth context
 * TODO: Replace with actual auth context when implemented
 */
export const getUserRole = (): UserRole => {
  if (typeof window === 'undefined') return 'staff';
  
  // For now, return from localStorage or default to 'staff'
  const role = localStorage.getItem('user_role');
  if (role === 'admin' || role === 'superadmin' || role === 'staff') {
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
 * Set user role in localStorage
 * TODO: Replace with actual auth context when implemented
 */
export const setUserRole = (role: UserRole): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_role', role);
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
 * Check if user has admin or superadmin role
 */
export const isAdmin = (): boolean => {
  const role = getUserRole();
  return role === 'admin' || role === 'superadmin';
};

/**
 * Check if user has superadmin role
 */
export const isSuperadmin = (): boolean => {
  return getUserRole() === 'superadmin';
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

