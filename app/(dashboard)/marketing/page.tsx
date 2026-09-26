'use client';

import { useEffect } from 'react';
import { DomainHub } from '@/components/layout/DomainHub';
import { navDomains } from '@/lib/nav';

const marketing = navDomains.find((d) => d.id === 'marketing')!;

export default function MarketingHubPage() {
  useEffect(() => {
    document.title = 'Marketing · EcomHub';
  }, []);

  return (
    <DomainHub
      title="Marketing"
      description="Ad budgets and spend by platform."
      items={marketing.items!}
    />
  );
}
