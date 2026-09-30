import { beforeEach, describe, expect, it } from 'vitest';
import {
  canApproveJournalEntry,
  canApproveOperationalExpense,
  canConnectShopeeShop,
  canPostJournalEntry,
  canUpdateJournalEntry,
  getUserRoles,
  hasAnyRole,
  hasRole,
  isAdmin,
  isSuperadmin,
  setUserRoles,
} from './authHelpers';

function clearAuthStorage() {
  localStorage.removeItem('user_roles');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_id');
}

describe('authHelpers', () => {
  beforeEach(() => {
    clearAuthStorage();
  });

  describe('getUserRoles / setUserRoles', () => {
    it('returns [] when nothing is stored', () => {
      expect(getUserRoles()).toEqual([]);
    });

    it('reads roles from user_roles JSON', () => {
      setUserRoles(['manager', 'viewer']);
      expect(getUserRoles()).toEqual(['manager', 'viewer']);
      expect(localStorage.getItem('user_role')).toBe('manager');
    });

    it('falls back to legacy user_role', () => {
      localStorage.setItem('user_role', 'staff');
      expect(getUserRoles()).toEqual(['staff']);
    });

    it('returns [] when user_roles JSON is invalid', () => {
      localStorage.setItem('user_roles', '{not-json');
      expect(getUserRoles()).toEqual([]);
    });
  });

  describe('hasRole / hasAnyRole / isAdmin', () => {
    it('hasRole matches stored roles', () => {
      setUserRoles(['viewer']);
      expect(hasRole('viewer')).toBe(true);
      expect(hasRole('admin')).toBe(false);
    });

    it('hasAnyRole is true when any required role matches', () => {
      setUserRoles(['manager']);
      expect(hasAnyRole(['admin', 'manager'])).toBe(true);
      expect(hasAnyRole(['admin', 'superadmin'])).toBe(false);
    });

    it('isAdmin is true for admin or superadmin', () => {
      setUserRoles(['admin']);
      expect(isAdmin()).toBe(true);
      setUserRoles(['superadmin']);
      expect(isAdmin()).toBe(true);
      setUserRoles(['staff']);
      expect(isAdmin()).toBe(false);
    });

    it('isSuperadmin requires superadmin only', () => {
      setUserRoles(['admin']);
      expect(isSuperadmin()).toBe(false);
      setUserRoles(['superadmin']);
      expect(isSuperadmin()).toBe(true);
    });

    it('canConnectShopeeShop is admin or superadmin only', () => {
      setUserRoles(['admin']);
      expect(canConnectShopeeShop()).toBe(true);
      setUserRoles(['superadmin']);
      expect(canConnectShopeeShop()).toBe(true);
      setUserRoles(['manager']);
      expect(canConnectShopeeShop()).toBe(false);
    });
  });

  describe('journal entry permissions', () => {
    it('admin can update draft only; superadmin any status', () => {
      setUserRoles(['admin']);
      expect(canUpdateJournalEntry('draft')).toBe(true);
      expect(canUpdateJournalEntry('posted')).toBe(false);

      setUserRoles(['superadmin']);
      expect(canUpdateJournalEntry('posted')).toBe(true);
    });

    it('approve requires draft (when status given) and admin-class role', () => {
      setUserRoles(['admin']);
      expect(canApproveJournalEntry('draft')).toBe(true);
      expect(canApproveJournalEntry('approved')).toBe(false);

      setUserRoles(['viewer']);
      expect(canApproveJournalEntry('draft')).toBe(false);
    });

    it('post requires approved status when status is given', () => {
      setUserRoles(['admin']);
      expect(canPostJournalEntry('approved')).toBe(true);
      expect(canPostJournalEntry('draft')).toBe(false);
    });
  });

  describe('operational expense permissions', () => {
    it('approve only when pending and admin-class', () => {
      setUserRoles(['admin']);
      expect(canApproveOperationalExpense('pending')).toBe(true);
      expect(canApproveOperationalExpense('approved')).toBe(false);

      setUserRoles(['staff']);
      expect(canApproveOperationalExpense('pending')).toBe(false);
    });
  });
});
