// Auth helper functions and hooks

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

