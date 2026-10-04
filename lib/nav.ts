/**
 * App navigation — EcomHub domains and features.
 *
 * Layout pattern follows  (dark top bar → domain hub → feature page).
 * Labels, grouping and routes are EcomHub-only (decision D7).
 */

export interface NavItem {
  label: string;
  href: string;
  description: string;
}

export interface NavDomain {
  id: string;
  label: string;
  /** Hub or leaf destination when the domain label is clicked. */
  href: string;
  /** Leaf domain (Dashboard) — no hub, no dropdown. */
  leaf?: boolean;
  items?: NavItem[];
  /** Optional setup items, reached via hub gear (Finance). */
  setup?: NavItem[];
}

export const navDomains: NavDomain[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    leaf: true,
  },
  {
    id: 'catalog',
    label: 'Catalog',
    href: '/catalog',
    items: [
      {
        label: 'Categories',
        href: '/master/categories',
        description: 'Product and expense category master data.',
      },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    href: '/marketing',
    items: [
      {
        label: 'Ad Budgets',
        href: '/marketing/ad-budgets',
        description: 'Plan and track ad spend budgets by platform.',
      },
      {
        label: 'Ad Expenses',
        href: '/marketing/ad-expenses',
        description: 'Ad spend totals by platform.',
      },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    href: '/sales',
    items: [
      {
        label: 'Shopee Orders',
        href: '/sales/shopee',
        description: 'Live Shopee order preview and escrow totals.',
      },
      {
        label: 'Shopee Returns',
        href: '/sales/returns',
        description: 'Shopee return requests and refund totals.',
      },
      {
        label: 'Shopee Ads',
        href: '/sales/ads',
        description: 'Shop-level ads spend, ROAS, and wallet balance.',
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    href: '/finance',
    items: [
      {
        label: 'Overview',
        href: '/finance/overview',
        description: 'Cash position and channel performance at a glance.',
      },
      {
        label: 'Accounts',
        href: '/finance/balances',
        description: 'Where the money is — balances by account.',
      },
      {
        label: 'Transactions',
        href: '/finance/transactions',
        description: 'Unified feed of money movements.',
      },
      {
        label: 'Channels',
        href: '/finance/channels',
        description: 'Revenue, expense and net by sales channel.',
      },
      {
        label: 'Journal Entries',
        href: '/finance/journal-entries',
        description: 'Create, approve and post double-entry journals.',
      },
      {
        label: 'Operational Expenses',
        href: '/finance/operational-expenses',
        description: 'Expense requests through approval and payment.',
      },
      {
        label: 'Capital & Investors',
        href: '/finance/capital-investors',
        description: 'Investor capital in and returns paid.',
      },
    ],
    setup: [
      {
        label: 'Chart of Accounts',
        href: '/finance/accounts',
        description: 'Account structure and codes.',
      },
      {
        label: 'Expense Categories',
        href: '/finance/expense-categories',
        description: 'Categories used on operational expenses.',
      },
      {
        label: 'Fiscal Periods',
        href: '/finance/fiscal-periods',
        description: 'Open and close accounting periods.',
      },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    href: '/integrations',
    items: [
      {
        label: 'Shopee',
        href: '/integrations/shopee',
        description: 'Connect a Shopee shop via Partner OAuth.',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    items: [
      {
        label: 'Tenants',
        href: '/settings/tenants',
        description: 'Create and manage toko (tenants). Superadmin only.',
      },
      {
        label: 'Users',
        href: '/settings/users',
        description: 'Roles and tenant membership. Superadmin only.',
      },
    ],
  },
];

export function domainForPath(pathname: string): NavDomain | undefined {
  if (!pathname) return undefined;
  if (pathname.startsWith('/dashboard') || pathname === '/') {
    return navDomains.find((d) => d.id === 'dashboard');
  }
  if (pathname.startsWith('/finance')) {
    return navDomains.find((d) => d.id === 'finance');
  }
  if (pathname.startsWith('/marketing')) {
    return navDomains.find((d) => d.id === 'marketing');
  }
  if (pathname.startsWith('/sales')) {
    return navDomains.find((d) => d.id === 'sales');
  }
  if (pathname.startsWith('/catalog') || pathname.startsWith('/master')) {
    return navDomains.find((d) => d.id === 'catalog');
  }
  if (pathname.startsWith('/integrations') || pathname.startsWith('/shopee-auth-callback')) {
    return navDomains.find((d) => d.id === 'integrations');
  }
  if (pathname.startsWith('/settings')) {
    return navDomains.find((d) => d.id === 'settings');
  }
  return undefined;
}

export function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}
