'use client';

import { useEffect } from 'react';
import { PageChrome, EmptyPanel } from '@/components/finance/PageChrome';

export default function FinanceBalancesPage() {
  useEffect(() => {
    document.title = 'Accounts · EcomHub';
  }, []);

  return (
    <PageChrome
      title="Accounts"
      description="Where is the money? Cash and wallet balances by account. Chart of Accounts (structure) lives under Finance › Setup."
    >
      <EmptyPanel
        title="Account balances"
        body="Will use GET /accounts/balance (T31) once FE8 wires this screen. Drill-down to transactions needs T33."
        gapIds={['G7']}
      />
    </PageChrome>
  );
}
