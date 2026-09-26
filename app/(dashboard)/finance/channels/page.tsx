'use client';

import { useEffect } from 'react';
import { GapPlaceholder, PageChrome, EmptyPanel } from '@/components/finance/PageChrome';

export default function FinanceChannelsPage() {
  useEffect(() => {
    document.title = 'Channels · EcomHub';
  }, []);

  return (
    <PageChrome
      title="Channels"
      description="Where is activity coming from? Per-channel financial view (accounting)."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {['Shopee', 'TikTok', 'General'].map((channel) => (
          <div key={channel} className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">{channel}</h2>
            <GapPlaceholder label="Revenue" gapId="G5" />
            <GapPlaceholder label="Expense" gapId="G5" />
            <GapPlaceholder label="Net" gapId="G5" />
            <GapPlaceholder label="Fees" gapId="G4" />
          </div>
        ))}
      </div>

      <EmptyPanel
        title="Notes"
        body="Fees amounts stay null until marketplace fee accounts exist (Decision 11 / G4). Do not invent fee totals in the UI."
        gapIds={['G4', 'G5']}
      />
    </PageChrome>
  );
}
