'use client';

import { useEffect } from 'react';
import { DomainHub } from '@/components/layout/DomainHub';
import { navDomains } from '@/lib/nav';

const integrations = navDomains.find((d) => d.id === 'integrations')!;

export default function IntegrationsHubPage() {
  useEffect(() => {
    document.title = 'Integrations · EcomHub';
  }, []);

  return (
    <DomainHub title="Integrations" items={integrations.items!} />
  );
}
