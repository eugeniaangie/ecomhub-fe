// Active tenant scope for the shell (FE32). Key is tenant_id — never Shopee shop_id.

import type { AllowedTenant, GetMeResponse } from './types';

export const TENANT_HEADER = 'X-Tenant-ID';

const STORAGE_TENANT_ID = 'tenant_id';
const STORAGE_TENANT_SCOPE = 'tenant_scope';
const STORAGE_CAN_MUTATE = 'tenant_can_mutate';
const STORAGE_ALLOWED = 'allowed_tenants';

export type TenantScope = 'all' | 'single';

export function getActiveTenantId(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_TENANT_ID);
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function setActiveTenantId(tenantId: number | null): void {
  if (typeof window === 'undefined') return;
  if (tenantId == null || tenantId <= 0) {
    sessionStorage.removeItem(STORAGE_TENANT_ID);
    return;
  }
  sessionStorage.setItem(STORAGE_TENANT_ID, String(tenantId));
}

export function getTenantScope(): TenantScope | null {
  if (typeof window === 'undefined') return null;
  const scope = sessionStorage.getItem(STORAGE_TENANT_SCOPE);
  if (scope === 'all' || scope === 'single') return scope;
  return null;
}

export function getStoredAllowedTenants(): AllowedTenant[] {
  if (typeof window === 'undefined') return [];
  const raw = sessionStorage.getItem(STORAGE_ALLOWED);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as AllowedTenant[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** False when non-superadmin has zero memberships (view-only shell). */
export function canMutateTenantData(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(STORAGE_CAN_MUTATE) === '1';
}

export function clearTenantData(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_TENANT_ID);
  sessionStorage.removeItem(STORAGE_TENANT_SCOPE);
  sessionStorage.removeItem(STORAGE_CAN_MUTATE);
  sessionStorage.removeItem(STORAGE_ALLOWED);
}

/**
 * Apply GET /auth/me tenant fields to sessionStorage.
 * Keeps a previously selected tenant_id when still allowed; otherwise uses
 * server active_tenant_id, then first allowed tenant.
 */
export function applyMeTenantState(me: GetMeResponse): {
  tenantId: number | null;
  scope: TenantScope;
  allowed: AllowedTenant[];
  canMutate: boolean;
} {
  const scope: TenantScope = me.tenant_scope === 'all' ? 'all' : 'single';
  const allowed = Array.isArray(me.allowed_tenants) ? me.allowed_tenants : [];
  const canMutate = scope === 'all' || allowed.length > 0;

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_TENANT_SCOPE, scope);
    sessionStorage.setItem(STORAGE_CAN_MUTATE, canMutate ? '1' : '0');
    sessionStorage.setItem(STORAGE_ALLOWED, JSON.stringify(allowed));
  }

  const allowedIds = new Set(allowed.map((t) => t.tenant_id));
  const previous = getActiveTenantId();
  let next: number | null = null;

  if (scope === 'all') {
    if (previous != null && (allowedIds.size === 0 || allowedIds.has(previous))) {
      next = previous;
    } else if (me.active_tenant_id != null && me.active_tenant_id > 0) {
      next = me.active_tenant_id;
    } else if (allowed.length > 0) {
      next = allowed[0].tenant_id;
    }
  } else {
    if (previous != null && allowedIds.has(previous)) {
      next = previous;
    } else if (
      me.active_tenant_id != null &&
      me.active_tenant_id > 0 &&
      allowedIds.has(me.active_tenant_id)
    ) {
      next = me.active_tenant_id;
    } else if (allowed.length > 0) {
      next = allowed[0].tenant_id;
    } else {
      next = null;
    }
  }

  setActiveTenantId(next);
  return { tenantId: next, scope, allowed, canMutate };
}
