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
    <DomainHub
      title="Catalog"
      description="Product and category master data. More catalog screens land here as they ship."
      items={catalog.items!}
    />
  );
}
