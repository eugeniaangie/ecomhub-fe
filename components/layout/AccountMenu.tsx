'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  canAccessSettings,
  canConnectShopeeShop,
  canManageTenants,
  canManageUsers,
  canSwitchTenant,
  logout,
} from '@/lib/authHelpers';
import {
  SETTINGS_SHOPEE_INTEGRATION_HREF,
  settingsNavItems,
  type NavItem,
} from '@/lib/nav';
import { useTenant } from './TenantProvider';

function visibleSettingsItems(): NavItem[] {
  return settingsNavItems.filter((item) => {
    if (item.href === SETTINGS_SHOPEE_INTEGRATION_HREF) return canConnectShopeeShop();
    if (item.href === '/settings/tenants') return canManageTenants();
    if (item.href === '/settings/users') return canManageUsers();
    return false;
  });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

/**
 * FE57 — account / profile menu: identity, Change tenant flyout, Settings, Logout.
 * Replaces the top-bar TenantSwitcher + Logout and the Settings domain tab.
 */
export function AccountMenu() {
  const router = useRouter();
  const {
    ready,
    scope,
    allowedTenants,
    activeTenantId,
    activeTenant,
    user,
    setTenantId,
  } = useTenant();
  const [open, setOpen] = useState(false);
  const [tenantPanel, setTenantPanel] = useState(false);
  const [tenantQuery, setTenantQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const canSwitch = canSwitchTenant() && scope === 'all';
  const showSettings = canAccessSettings();
  const settingsItems = useMemo(() => visibleSettingsItems(), []);

  const displayName =
    user?.full_name?.trim() || user?.username?.trim() || 'Account';
  const email = user?.email?.trim() || '';
  const tenantLabel =
    activeTenant?.name ??
    (allowedTenants[0]?.name ?? (ready ? 'No tenant' : '…'));

  const filteredTenants = useMemo(() => {
    const q = tenantQuery.trim().toLowerCase();
    if (!q) return allowedTenants;
    return allowedTenants.filter((t) => t.name.toLowerCase().includes(q));
  }, [allowedTenants, tenantQuery]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setTenantPanel(false);
        setTenantQuery('');
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (tenantPanel) {
          setTenantPanel(false);
          setTenantQuery('');
        } else {
          setOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, tenantPanel]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const pickTenant = (tenantId: number) => {
    if (tenantId === activeTenantId) {
      setTenantPanel(false);
      setOpen(false);
      return;
    }
    setTenantId(tenantId);
    window.location.reload();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        onClick={() => {
          setOpen((prev) => !prev);
          setTenantPanel(false);
          setTenantQuery('');
        }}
        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xs font-semibold text-white"
          aria-hidden
        >
          {initials(displayName)}
        </span>
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 flex items-start gap-2">
          {tenantPanel && canSwitch && (
            <div
              role="dialog"
              aria-label="Change tenant"
              className="w-72 rounded-lg border border-gray-200 bg-white py-2 text-gray-900 shadow-xl"
            >
              <div className="px-3 pb-2">
                <label className="sr-only" htmlFor="account-tenant-search">
                  Search tenants
                </label>
                <input
                  id="account-tenant-search"
                  type="search"
                  value={tenantQuery}
                  onChange={(e) => setTenantQuery(e.target.value)}
                  placeholder="Search tenants"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
                  autoFocus
                />
              </div>
              <ul className="max-h-64 overflow-auto px-1">
                {filteredTenants.length === 0 ? (
                  <li className="px-3 py-2 text-xs text-gray-500">No matches</li>
                ) : (
                  filteredTenants.map((t) => {
                    const selected = t.tenant_id === activeTenantId;
                    return (
                      <li key={t.tenant_id}>
                        <button
                          type="button"
                          onClick={() => pickTenant(t.tenant_id)}
                          className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                            selected
                              ? 'bg-sky-50 text-sky-900'
                              : 'text-gray-800 hover:bg-gray-50'
                          }`}
                        >
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-600"
                            aria-hidden
                          >
                            {initials(t.name)}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {t.name}
                            {!t.is_active ? (
                              <span className="ml-1 text-xs font-normal text-gray-400">
                                (inactive)
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}

          <div
            role="menu"
            className="w-72 rounded-lg border border-gray-200 bg-white py-2 text-gray-900 shadow-xl"
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-800 text-sm font-semibold text-white"
                aria-hidden
              >
                {initials(displayName)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {displayName}
                </p>
                {email ? (
                  <p className="truncate text-xs text-gray-500">{email}</p>
                ) : null}
              </div>
            </div>

            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-500">Active tenant</p>
              <p className="truncate text-sm font-medium text-gray-900">
                {tenantLabel}
              </p>
              {canSwitch ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setTenantPanel((prev) => !prev)}
                  className="mt-2 cursor-pointer text-sm font-medium text-sky-700 hover:text-sky-900"
                >
                  {tenantPanel ? 'Hide tenant list' : 'Change tenant'}
                </button>
              ) : null}
            </div>

            {showSettings && (
              <div className="border-t border-gray-100 py-1">
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                >
                  Settings
                </Link>
                {settingsItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-1.5 pl-6 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleLogout()}
                className="block w-full cursor-pointer px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
