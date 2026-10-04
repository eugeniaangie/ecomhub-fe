'use client';

import { useEffect, useState } from 'react';
import { DomainHub } from '@/components/layout/DomainHub';
import { Card } from '@/components/ui/Card';
import { navDomains } from '@/lib/nav';

const settings = navDomains.find((d) => d.id === 'settings')!;

function canAccessSettingsLocal(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('user_roles');
    if (!raw) return localStorage.getItem('user_role') === 'superadmin';
    const roles = JSON.parse(raw) as unknown;
    return Array.isArray(roles) && roles.includes('superadmin');
  } catch {
    return false;
  }
}

export default function SettingsHubPage() {
  const [canAccess] = useState(() => canAccessSettingsLocal());

  useEffect(() => {
    document.title = 'Settings · EcomHub';
  }, []);

  if (!canAccess) {
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
