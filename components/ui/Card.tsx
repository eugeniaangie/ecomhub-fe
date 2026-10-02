import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
  /** When set with onToggleCollapse, body is hidden while true. */
  collapsed?: boolean;
  /** Makes the header clickable and shows a chevron. */
  onToggleCollapse?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  actions,
  collapsed = false,
  onToggleCollapse,
}) => {
  const isCollapsible = typeof onToggleCollapse === 'function';
  const showBody = !isCollapsible || !collapsed;
  const showHeader = Boolean(title || actions || isCollapsible);

  const headerInner = (
    <>
      {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
      <div className="flex items-center gap-2">
        {actions}
        {isCollapsible ? (
          <svg
            className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
              collapsed ? '-rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        ) : null}
      </div>
    </>
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {showHeader ? (
        isCollapsible ? (
          <button
            type="button"
            className={`flex w-full cursor-pointer items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50 ${
              showBody ? 'border-b border-gray-200' : ''
            }`}
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
          >
            {headerInner}
          </button>
        ) : (
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            {headerInner}
          </div>
        )
      ) : null}
      {showBody ? <div className="px-6 py-4">{children}</div> : null}
    </div>
  );
};
