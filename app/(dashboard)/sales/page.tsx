'use client';

import { useEffect } from 'react';
import { DomainHub } from '@/components/layout/DomainHub';
import { navDomains } from '@/lib/nav';

const sales = navDomains.find((d) => d.id === 'sales')!;

export default function SalesHubPage() {
  useEffect(() => {
    document.title = 'Sales · EcomHub';
  }, []);

  return <DomainHub title="Sales" items={sales.items!} />;
}
