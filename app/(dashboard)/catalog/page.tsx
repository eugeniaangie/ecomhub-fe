'use client';

import { useEffect } from 'react';
import { DomainHub } from '@/components/layout/DomainHub';
import { navDomains } from '@/lib/nav';

const catalog = navDomains.find((d) => d.id === 'catalog')!;

export default function CatalogHubPage() {
  useEffect(() => {
    document.title = 'Catalog · EcomHub';
  }, []);

  return (
    <DomainHub title="Catalog" items={catalog.items!} />
  );
}
