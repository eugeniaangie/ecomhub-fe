'use client';

import { useEffect } from 'react';
import { DomainHub } from '@/components/layout/DomainHub';
import { navDomains } from '@/lib/nav';

const stock = navDomains.find((d) => d.id === 'stock')!;

export default function StockHubPage() {
  useEffect(() => {
    document.title = 'Stock · EcomHub';
  }, []);

  return <DomainHub title="Stock" items={stock.items ?? []} />;
}
