'use client';

// Status Badge Component

import React from 'react';

interface StatusBadgeProps {
  label: string;
  colorClass: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, colorClass }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
};

