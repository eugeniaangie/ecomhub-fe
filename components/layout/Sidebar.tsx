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
  {
    label: 'Dashboard',
    href: '/dashboard',
    children: [
      { label: 'Finance Dashboard', href: '/finance/dashboard' },
      // { label: 'Sales Dashboard', href: '/sales/dashboard' },
    ],
  },
  {
    label: 'Master Data',
    href: '/master',
    children: [
      { label: 'Categories', href: '/master/categories' },
      { label: 'Chart of Accounts', href: '/finance/accounts' },
      { label: 'Expense Categories', href: '/finance/expense-categories' },
      // { label: 'Users & Roles', href: '/master/users' },
      // { label: 'Product Attributes', href: '/master/product-attributes' },
      // { label: 'Pricing Rules', href: '/master/pricing-rules' },
    ],
  },
  // {
  //   label: 'Inventory',
  //   href: '/inventory',
  //   children: [
  //     { label: 'Products', href: '/inventory/products' },
  //     { label: 'Stock Management', href: '/inventory/stock' },
  //     { label: 'Low Stock Alerts', href: '/inventory/alerts' },
  //   ],
  // },
  {
    label: 'Finance Management',
    href: '/finance',
    children: [
      {
        label: 'Transactions',
        href: '/finance/transactions',
        children: [
          { label: 'Journal Entries', href: '/finance/journal-entries' },
          // { label: 'Income', href: '/finance/transactions/income' },
          // { label: 'Expenses', href: '/finance/transactions/expenses' },
          // { label: 'Transfers', href: '/finance/transactions/transfers' },
        ],
      },
      { label: 'Operational Expenses', href: '/finance/operational-expenses' },
      {
        label: 'Budget Planning',
        href: '/finance/budget',
        children: [
          { label: 'Ad Budgets', href: '/finance/ad-budgets' },
          // { label: 'Monthly Budgets', href: '/finance/monthly-budgets' },
        ],
      },
      { label: 'Capital & Investors', href: '/finance/capital-investors' },
      { label: 'Fiscal Periods', href: '/finance/fiscal-periods' },
      // {
      //   label: 'Financial Reports',
      //   href: '/finance/reports',
      //   children: [
      //     { label: 'Profit & Loss', href: '/finance/reports/profit-loss' },
      //     { label: 'Cash Flow', href: '/finance/reports/cash-flow' },
      //     { label: 'Balance Sheet', href: '/finance/reports/balance-sheet' },
      //   ],
      // },
    ],
  },
  // {
  //   label: 'Orders',
  //   href: '/orders',
  //   children: [
  //     { label: 'Order List', href: '/orders' },
  //     { label: 'Process Orders', href: '/orders/process' },
  //     { label: 'Fake Orders / Fraud', href: '/orders/fraud' },
  //   ],
  // },
  // {
  //   label: 'Marketplace',
  //   href: '/marketplace',
  //   children: [
  //     { label: 'Connected Stores', href: '/marketplace/stores' },
  //     { label: 'Sync Products', href: '/marketplace/sync' },
  //     { label: 'Settlements', href: '/marketplace/settlements' },
  //   ],
  // },
  // {
  //   label: 'Reports',
  //   href: '/reports',
  //   children: [
  //     { label: 'Sales Report', href: '/reports/sales' },
  //     { label: 'Stock Report', href: '/reports/stock' },
  //     { label: 'Product Performance', href: '/reports/products' },
  //     { label: 'Expense Summary', href: '/reports/expenses' },
  //   ],
  // },
  // {
  //   label: 'Settings',
  //   href: '/settings',
  //   children: [
  //     { label: 'Profile', href: '/settings/profile' },
  //     { label: 'Store Settings', href: '/settings/store' },
  //     { label: 'Integrations', href: '/settings/integrations' },
  //     { label: 'Preferences', href: '/settings/preferences' },
  //   ],
  // },
];

const renderNavItem = (
  item: NavItem,
  pathname: string,
  expandedMenus: string[],
  toggleMenu: (href: string) => void,
  level: number = 0
) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedMenus.includes(item.href);
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  
  // Determine classes based on level
  let paddingClass = 'px-4 py-3';
  let textSizeClass = 'text-base';
  let indentClass = '';
  let childIndentClass = 'ml-4';
  
  if (level === 1) {
    paddingClass = 'px-4 py-2';
    textSizeClass = 'text-sm';
    indentClass = '';
    childIndentClass = 'ml-4';
  } else if (level >= 2) {
    paddingClass = 'px-4 py-1.5';
    textSizeClass = 'text-sm';
    indentClass = '';
    childIndentClass = 'ml-4';
  }

  return (
    <li key={item.href}>
      {hasChildren ? (
        <>
          <button
            onClick={() => toggleMenu(item.href)}
            className={`w-full flex items-center justify-between ${paddingClass} rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer ${indentClass}`}
          >
            <span className={`flex items-center ${textSizeClass}`}>
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
            <ul className={`${childIndentClass} mt-1 space-y-1`}>
              {item.children!.map((child) => renderNavItem(child, pathname, expandedMenus, toggleMenu, level + 1))}
            </ul>
          )}
        </>
      ) : (
        <Link
          href={item.href}
          className={`
            flex items-center ${paddingClass} rounded-lg transition-colors ${textSizeClass} cursor-pointer
            ${isActive
              ? 'text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }
            ${indentClass}
          `}
          style={isActive ? { backgroundColor: '#6A89A7' } : {}}
        >
          {item.label}
        </Link>
      )}
    </li>
  );
};

// Helper function to get all parent menu hrefs that should be expanded
const getAllParentMenus = (items: NavItem[]): string[] => {
  const parents: string[] = [];
  const traverse = (items: NavItem[]) => {
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        parents.push(item.href);
        traverse(item.children);
      }
    });
  };
  traverse(items);
  return parents;
};

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(getAllParentMenus(navItems));

  const toggleMenu = (href: string) => {
    setExpandedMenus(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold">EcomHub</h1>
        <p className="text-sm text-gray-400 mt-1">Internal Dashboard</p>
      </div>
      <nav className="px-4">
        <ul className="space-y-2">
          {navItems.map((item) => renderNavItem(item, pathname, expandedMenus, toggleMenu))}
        </ul>
      </nav>
    </aside>
  );
};

