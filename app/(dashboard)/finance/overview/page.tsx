'use client';

import { useEffect } from 'react';
import { GapPlaceholder, PageChrome, EmptyPanel } from '@/components/finance/PageChrome';

export default function FinanceOverviewPage() {
  useEffect(() => {
    document.title = 'Finance Overview · EcomHub';
  }, []);

  return (
    <PageChrome
      title="Overview"
      description="Where the cash is, and how channels are performing. Accounting view — not ops GMV."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <GapPlaceholder label="Total cash" gapId="G7" />
        <GapPlaceholder label="Channel net (aggregate)" gapId="G5" />
        <GapPlaceholder label="Fees (all channels)" gapId="G4" />
      </div>

      <EmptyPanel
        title="Channel performance"
        body="Side-by-side revenue / expense / net per channel. Empty until T32. Fees row may appear later as null until fee accounts exist (G4)."
        gapIds={['G5', 'G7']}
      />
    </PageChrome>
  );
}
