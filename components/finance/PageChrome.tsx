'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

interface GapPlaceholderProps {
  /** Short label shown above the empty value */
  label: string;
  /** Gap register id from docs/design/ui-backend-gaps.md, e.g. G4 */
  gapId?: string;
  className?: string;
}

/** Empty metric slot — never invents a number. */
export const GapPlaceholder: React.FC<GapPlaceholderProps> = ({
  label,
  gapId,
  className = '',
}) => {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white px-4 py-3 ${className}`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-300">—</p>
      {gapId ? (
        <p className="mt-1 text-xs text-gray-400">Awaiting API ({gapId})</p>
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

/** Standard title row + white content surface for finance/shell pages. */
export const PageChrome: React.FC<PageChromeProps> = ({
  title,
  description,
  actions,
  children,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
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
