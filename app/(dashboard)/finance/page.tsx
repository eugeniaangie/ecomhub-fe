'use client';

import { useEffect } from 'react';
import { DomainHub } from '@/components/layout/DomainHub';
import { navDomains } from '@/lib/nav';

const finance = navDomains.find((d) => d.id === 'finance')!;

export default function FinanceHubPage() {
  useEffect(() => {
    document.title = 'Finance · EcomHub';
  }, []);

  return (
    <DomainHub
      title="Finance"
      items={finance.items!}
      setupHref="/finance/setup"
      setupLabel="Finance setup"
    />
  );
}
