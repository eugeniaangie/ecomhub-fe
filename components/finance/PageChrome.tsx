'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';

interface GapPlaceholderProps {
  /** Short label shown above the empty value */
  label: string;
  /** Gap register id from docs/design/ui-backend-gaps.md, e.g. G4 */
  gapId?: string;
  /**
   * Keep the slot on screen but greyed out (deferred API / not interactive).
   * Prefer this over commenting the JSX out — the gap id stays visible in the UI.
   */
  disabled?: boolean;
  className?: string;
}

/** Empty metric slot — never invents a number. */
export const GapPlaceholder: React.FC<GapPlaceholderProps> = ({
  label,
  gapId,
  disabled = false,
  className = '',
}) => {
  return (
    <div
      aria-disabled={disabled || undefined}
      className={`rounded-lg border px-4 py-3 ${
        disabled
          ? 'border-gray-100 bg-gray-50 opacity-60'
          : 'border-gray-200 bg-white'
      } ${className}`}
    >
      <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-300">—</p>
      {gapId ? (
        <p className="mt-1 text-xs text-gray-400">
          {disabled ? `Disabled — awaiting API (${gapId})` : `Awaiting API (${gapId})`}
        </p>
      ) : null}
    </div>
  );
};

interface PageChromeProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/** Standard title row + content for finance/shell pages. */
export const PageChrome: React.FC<PageChromeProps> = ({
  title,
  description,
  actions,
  children,
}) => {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  );
};

interface EmptyPanelProps {
  title: string;
  body: string;
  gapIds?: string[];
}

export const EmptyPanel: React.FC<EmptyPanelProps> = ({ title, body, gapIds }) => {
  return (
    <Card title={title}>
      <p className="text-sm text-gray-600">{body}</p>
      {gapIds && gapIds.length > 0 ? (
        <p className="mt-3 text-xs text-gray-400">
          Tracked gaps: {gapIds.join(', ')} — see docs/design/ui-backend-gaps.md
        </p>
      ) : null}
    </Card>
  );
};
