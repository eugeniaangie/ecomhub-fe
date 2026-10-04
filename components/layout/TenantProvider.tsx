'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AllowedTenant, GetMeResponse } from '@/lib/types';
import {
  applyMeTenantState,
  canMutateTenantData,
  getActiveTenantId,
  getStoredAllowedTenants,
  getTenantScope,
  setActiveTenantId,
  type TenantScope,
} from '@/lib/tenant';

interface TenantContextValue {
  ready: boolean;
  scope: TenantScope | null;
  allowedTenants: AllowedTenant[];
  activeTenantId: number | null;
  canMutate: boolean;
  activeTenant: AllowedTenant | null;
  /** Superadmin-only: switch active tenant and persist. */
  setTenantId: (tenantId: number) => void;
  /** Apply fields from GET /auth/me. */
  hydrateFromMe: (me: GetMeResponse) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [scope, setScope] = useState<TenantScope | null>(null);
  const [allowedTenants, setAllowedTenants] = useState<AllowedTenant[]>([]);
  const [activeTenantId, setActiveId] = useState<number | null>(null);
  const [canMutate, setCanMutate] = useState(false);

  const hydrateFromMe = useCallback((me: GetMeResponse) => {
    const next = applyMeTenantState(me);
    setScope(next.scope);
    setAllowedTenants(next.allowed);
    setActiveId(next.tenantId);
    setCanMutate(next.canMutate);
    setReady(true);
  }, []);

  const setTenantId = useCallback(
    (tenantId: number) => {
      if (scope !== 'all') return;
      if (!allowedTenants.some((t) => t.tenant_id === tenantId)) return;
      setActiveTenantId(tenantId);
      setActiveId(tenantId);
    },
    [scope, allowedTenants]
  );

  const activeTenant = useMemo(() => {
    if (activeTenantId == null) return null;
    return allowedTenants.find((t) => t.tenant_id === activeTenantId) ?? null;
  }, [allowedTenants, activeTenantId]);

  const value = useMemo<TenantContextValue>(
    () => ({
      ready,
      scope,
      allowedTenants,
      activeTenantId,
      canMutate,
      activeTenant,
      setTenantId,
      hydrateFromMe,
    }),
    [
      ready,
      scope,
      allowedTenants,
      activeTenantId,
      canMutate,
      activeTenant,
      setTenantId,
      hydrateFromMe,
    ]
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    // Fallback for rare callers outside provider (read session only).
    return {
      ready: false,
      scope: getTenantScope(),
      allowedTenants: getStoredAllowedTenants(),
      activeTenantId: getActiveTenantId(),
      canMutate: canMutateTenantData(),
      activeTenant: null,
      setTenantId: () => undefined,
      hydrateFromMe: () => undefined,
    };
  }
  return ctx;
}
