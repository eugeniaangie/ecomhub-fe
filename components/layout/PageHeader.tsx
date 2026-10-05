'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { domainForPath } from '@/lib/nav';

export interface PageHeaderParent {
  label: string;
  href: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /**
   * Parent crumb (linked). Default: current nav domain hub.
   * Pass `null` to hide the crumb (e.g. Dashboard leaf).
   */
  parent?: PageHeaderParent | null;
  className?: string;
}

/**
 * Page title with optional `Domain / Page` breadcrumb (same pattern as Settings → Shopee Integration).
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  parent,
  className = '',
}) => {
  const pathname = usePathname() ?? '';
  const domain = domainForPath(pathname);

  const resolvedParent =
    parent === undefined
      ? domain && !domain.leaf
        ? { label: domain.label, href: domain.href }
        : null
      : parent;

  const showCrumb = Boolean(resolvedParent && resolvedParent.label !== title);

  return (
    <div className={`flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div>
        {showCrumb && resolvedParent ? (
          <p className="text-sm text-gray-500">
            <Link
              href={resolvedParent.href}
              className="hover:text-gray-800 hover:underline"
            >
              {resolvedParent.label}
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-600">{title}</span>
          </p>
        ) : null}
        <h1
          className={`text-2xl font-bold text-gray-900 ${showCrumb ? 'mt-1' : ''}`}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-gray-600">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
};
