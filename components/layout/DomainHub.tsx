'use client';

import Link from 'next/link';
import type { NavItem } from '@/lib/nav';

interface DomainHubProps {
  title: string;
  description?: string;
  items: NavItem[];
  /** Optional gear link (e.g. Finance Setup). */
  setupHref?: string;
  setupLabel?: string;
}

export const DomainHub: React.FC<DomainHubProps> = ({
  title,
  description,
  items,
  setupHref,
  setupLabel = 'Setup',
}) => {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-gray-600">{description}</p>
          ) : null}
        </div>
        {setupHref ? (
          <Link
            href={setupHref}
            aria-label={setupLabel}
            title={setupLabel}
            className="rounded-lg border border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-800"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:border-gray-300 hover:shadow-md"
          >
            <h2 className="text-base font-semibold text-gray-900 group-hover:text-[#6A89A7]">
              {item.label}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};
