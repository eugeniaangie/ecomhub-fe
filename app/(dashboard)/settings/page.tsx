'use client';

import { useEffect, useMemo } from 'react';
import { DomainHub } from '@/components/layout/DomainHub';
import { Card } from '@/components/ui/Card';
import {
  canAccessSettings,
  canConnectShopeeShop,
  canManageTenants,
  canManageUsers,
} from '@/lib/authHelpers';
import { navDomains, SETTINGS_SHOPEE_INTEGRATION_HREF } from '@/lib/nav';

const settings = navDomains.find((d) => d.id === 'settings')!;

export default function SettingsHubPage() {
  useEffect(() => {
    document.title = 'Settings · EcomHub';
  }, []);

  const items = useMemo(() => {
    return (settings.items ?? []).filter((item) => {
      if (item.href === SETTINGS_SHOPEE_INTEGRATION_HREF) return canConnectShopeeShop();
      if (item.href === '/settings/tenants') return canManageTenants();
      if (item.href === '/settings/users') return canManageUsers();
      return false;
    });
  }, []);

  // Render gate only — Core enforces per-route roles. Mounted after PageWrapper auth.
  if (!canAccessSettings()) {
    return (
      <Card title="Access">
        <p className="text-sm text-gray-600">
          Settings is available to admin and superadmin accounts.
        </p>
      </Card>
    );
  }

  return <DomainHub title="Settings" items={items} />;
}
