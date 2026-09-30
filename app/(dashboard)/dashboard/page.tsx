'use client';

import { useEffect } from 'react';
import { GapPlaceholder, PageChrome, EmptyPanel } from '@/components/finance/PageChrome';

const KPI_LABELS = [
  { label: 'Gross sales', gapId: 'G1' },
  { label: 'Discount', gapId: 'G1' },
  { label: 'Returns', gapId: 'G1' },
  { label: 'Net sales', gapId: 'G1' },
  { label: 'Profit', gapId: 'G1' },
  { label: 'COGS / ads', gapId: 'G1' },
] as const;

export default function HomeDashboardPage() {
  useEffect(() => {
    document.title = 'Dashboard · EcomHub';
  }, []);

  return (
    <PageChrome title="Dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KPI_LABELS.map((kpi) => (
          <GapPlaceholder key={kpi.label} label={kpi.label} gapId={kpi.gapId} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EmptyPanel
            title="Sales vs returns trend"
            body="Chart placeholder. Wire when a trend series endpoint exists."
            gapIds={['G2']}
          />
        </div>
        <EmptyPanel
          title="By channel"
          body="Channel breakdown for the ops view. Distinct from Finance → Channels (accounting)."
          gapIds={['G3']}
        />
      </div>
    </PageChrome>
  );
}
