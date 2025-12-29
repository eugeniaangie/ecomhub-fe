'use client';

import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Button } from '../ui/Button';

export const Topbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    auth.clearToken();
    router.push('/login');
  };

  // Get page title based on pathname
  const getPageTitle = () => {
    if (pathname?.includes('/master/categories')) return 'Master Category';
    if (pathname?.includes('/master')) return 'Master Data';
    if (pathname?.includes('/finance')) return 'Finance';
    return 'Dashboard';
  };

  return (
    <header className="fixed top-0 left-64 right-0 z-50 bg-white border-b border-gray-200 px-6 h-16 flex items-center">
      <div className="flex items-center justify-between w-full">
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

