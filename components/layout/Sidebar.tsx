'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  // { label: 'Dashboard', href: '/' },
  // { label: 'Financial Records', href: '/finance' },
  {
    label: 'Master Data',
    href: '/master',
    children: [
      { label: 'Categories', href: '/master/categories' },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/master']);

  const toggleMenu = (href: string) => {
    setExpandedMenus(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  const isMenuExpanded = (href: string) => expandedMenus.includes(href);

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold">EcomHub</h1>
        <p className="text-sm text-gray-400 mt-1">Internal Dashboard</p>
      </div>
      <nav className="px-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = isMenuExpanded(item.href);

            return (
              <li key={item.href}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleMenu(item.href)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                      <span className="flex items-center">
                        {item.icon && <span className="mr-3">{item.icon}</span>}
                        {item.label}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <ul className="ml-4 mt-2 space-y-1">
                        {item.children!.map((child) => {
                          const isChildActive = pathname === child.href;
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`
                                  flex items-center px-4 py-2 rounded-lg transition-colors text-sm
                                  ${isChildActive
                                    ? 'text-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                  }
                                `}
                                style={isChildActive ? { backgroundColor: '#6A89A7' } : {}}
                              >
                                {child.icon && <span className="mr-3">{child.icon}</span>}
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    {item.icon && <span className="mr-3">{item.icon}</span>}
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

