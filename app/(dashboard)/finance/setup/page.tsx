'use client';

import { useEffect } from 'react';
import { DomainHub } from '@/components/layout/DomainHub';
import { navDomains } from '@/lib/nav';

const finance = navDomains.find((d) => d.id === 'finance')!;

/** Chart of Accounts, Expense Categories, Fiscal Periods — setup for Finance. */
export default function FinanceSetupPage() {
  useEffect(() => {
    document.title = 'Finance Setup · EcomHub';
  }, []);

  return (
    <DomainHub
      title="Finance setup"
      description="Master lists that Finance screens depend on. Not day-to-day money views."
      items={finance.setup!}
    />
  );
}
