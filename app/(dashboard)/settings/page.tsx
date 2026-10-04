'use client';

import { useEffect } from 'react';
import { DomainHub } from '@/components/layout/DomainHub';
import { Card } from '@/components/ui/Card';
import { canManageTenants } from '@/lib/authHelpers';
import { navDomains } from '@/lib/nav';

const settings = navDomains.find((d) => d.id === 'settings')!;

export default function SettingsHubPage() {
  useEffect(() => {
    document.title = 'Settings · EcomHub';
  }, []);

  // Render gate only — Core RequireRole(superadmin). Mounted after PageWrapper auth.
  if (!canManageTenants()) {
    return (
      <Card title="Access">
        <p className="text-sm text-gray-600">
          Settings is available to superadmin only.
        </p>
      </Card>
    );
  }

  return <DomainHub title="Settings" items={settings.items!} />;
}
