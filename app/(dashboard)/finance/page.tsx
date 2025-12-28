'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

const financeModules = [
  {
    title: 'Fiscal Periods',
    description: 'Manage fiscal periods, close and reopen accounting periods',
    href: '/finance/fiscal-periods',
    icon: '📅',
    features: ['Create periods', 'Close periods', 'Admin controls'],
  },
  {
    title: 'Expense Categories',
    description: 'Organize expenses into categories for better tracking',
    href: '/finance/expense-categories',
    icon: '📁',
    features: ['Simple CRUD', 'Search & filter', 'Easy management'],
  },
  {
    title: 'Chart of Accounts',
    description: 'Manage your chart of accounts with hierarchical structure',
    href: '/finance/accounts',
    icon: '📊',
    features: ['Hierarchical accounts', '7 account types', 'Active/Inactive status'],
  },
  {
    title: 'Operational Expenses',
    description: 'Track and approve operational expenses with workflow',
    href: '/finance/operational-expenses',
    icon: '💰',
    features: ['Approval workflow', 'Status tracking', 'Payment management'],
  },
  {
    title: 'Ad Budgets',
    description: 'Track marketing and advertising budgets per platform',
    href: '/finance/ad-budgets',
    icon: '📢',
    features: ['Platform budgets', 'Spent tracking', 'Progress visualization'],
  },
  {
    title: 'Capital Investors',
    description: 'Manage capital investments and investor relationships',
    href: '/finance/capital-investors',
    icon: '💼',
    features: ['Investment tracking', 'Return management', 'Status updates'],
  },
  {
    title: 'Journal Entries',
    description: 'Double-entry bookkeeping with approval workflow',
    href: '/finance/journal-entries',
    icon: '📝',
    features: ['Double-entry validation', 'Approval workflow', 'Post to accounts'],
  },
];

export default function FinancePage() {
  useEffect(() => {
    document.title = 'Finance Management';
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance Management</h1>
        <p className="text-gray-600">
          Comprehensive finance management for your e-commerce operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {financeModules.map((module) => (
          <Link key={module.href} href={module.href} className="block">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{module.icon}</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {module.title}
                    </h2>
                    <p className="text-gray-600 mb-4">{module.description}</p>
                    <ul className="space-y-1">
                      {module.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-500">
                          <svg
                            className="w-4 h-4 mr-2 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Start Guide</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>1. Set up Fiscal Periods:</strong> Define your accounting periods to organize
              financial data by time frames.
            </p>
            <p>
              <strong>2. Create Expense Categories:</strong> Categorize your expenses for better
              tracking and reporting.
            </p>
            <p>
              <strong>3. Set up Chart of Accounts:</strong> Define your account structure with
              proper account codes and types.
            </p>
            <p>
              <strong>4. Manage Operational Expenses:</strong> Submit, approve, and track your
              day-to-day operational expenses.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
