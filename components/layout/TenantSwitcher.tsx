'use client';

import { useTenant } from './TenantProvider';

/**
 * FE32 — superadmin: select active tenant. Admin: fixed label only.
 * Switcher uses tenant_scope === 'all' (same rule as canSwitchTenant / FE35).
 */
export function TenantSwitcher() {
  const { ready, scope, allowedTenants, activeTenantId, activeTenant, setTenantId } =
    useTenant();

  if (!ready) return null;

  if (scope === 'all') {
    if (allowedTenants.length === 0) {
      return (
        <span className="relative z-10 mr-3 max-w-48 truncate text-xs text-gray-400">
          No tenants
        </span>
      );
    }
    return (
      <label className="relative z-10 mr-3 flex items-center gap-2 text-xs text-gray-300">
        <span className="sr-only">Active tenant</span>
        <select
          className="max-w-56 rounded border border-gray-700 bg-gray-800 px-2 py-1 text-sm text-white"
          value={activeTenantId ?? ''}
          onChange={(e) => {
            const id = parseInt(e.target.value, 10);
            if (Number.isFinite(id) && id > 0) {
              setTenantId(id);
              // Reload so pages refetch under the new tenant (no React Query cache).
              window.location.reload();
            }
          }}
          aria-label="Switch tenant"
        >
          {allowedTenants.map((t) => (
            <option key={t.tenant_id} value={t.tenant_id}>
              {t.name}
              {!t.is_active ? ' (inactive)' : ''}
            </option>
          ))}
        </select>
      </label>
    );
  }

  // single — fixed name, no switcher
  const label =
    activeTenant?.name ??
    (allowedTenants[0]?.name ?? 'Belum di-assign ke toko');

  return (
    <span
      className="relative z-10 mr-3 max-w-56 truncate text-xs text-gray-300"
      title={label}
    >
      {label}
    </span>
  );
}
