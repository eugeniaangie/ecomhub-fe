'use client';

import { useRouter, usePathname } from 'next/navigation';
import { logout } from '@/lib/authHelpers';
import { Button } from '../ui/Button';

export const Topbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getPageTitle = () => {
    if (!pathname) return 'Dashboard';
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/master/categories')) return 'Categories';
    if (pathname.startsWith('/master')) return 'Master Data';
    if (pathname.startsWith('/finance/overview')) return 'Finance · Overview';
    if (pathname.startsWith('/finance/balances')) return 'Finance · Accounts';
    if (pathname.startsWith('/finance/transactions')) return 'Finance · Transactions';
    if (pathname.startsWith('/finance/channels')) return 'Finance · Channels';
    if (pathname.startsWith('/finance/ad-dashboard')) return 'Finance · Ad Expenses';
    if (pathname.startsWith('/finance/journal-entries')) return 'Finance · Journal Entries';
    if (pathname.startsWith('/finance/operational-expenses')) return 'Finance · Expenses';
    if (pathname.startsWith('/finance/ad-budgets')) return 'Finance · Ad Budgets';
    if (pathname.startsWith('/finance/capital-investors')) return 'Finance · Capital';
    if (pathname.startsWith('/finance/accounts')) return 'Chart of Accounts';
    if (pathname.startsWith('/finance/expense-categories')) return 'Expense Categories';
    if (pathname.startsWith('/finance/fiscal-periods')) return 'Fiscal Periods';
    if (pathname.startsWith('/finance/dashboard')) return 'Finance · Legacy dashboard';
    if (pathname.startsWith('/finance')) return 'Finance';
    return 'Dashboard';
  };

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h2>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
