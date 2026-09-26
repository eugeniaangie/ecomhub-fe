'use client';

import { useEffect } from 'react';
import { PageChrome, EmptyPanel } from '@/components/finance/PageChrome';

export default function FinanceTransactionsPage() {
  useEffect(() => {
    document.title = 'Transactions · EcomHub';
  }, []);

  return (
    <PageChrome
      title="Transactions"
      description="Unified feed across accounts and channels. Journal entry CRUD remains under Journal Entries."
    >
      <EmptyPanel
        title="Transaction feed"
        body="Empty until T33 (unified transactions). The legacy Shopee-only feed on /finance/dashboard is not linked from the sidebar."
        gapIds={['G6']}
      />
    </PageChrome>
  );
}
