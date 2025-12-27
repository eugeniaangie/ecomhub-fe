'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface PageWrapperProps {
  children: React.ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication on mount and when pathname changes
    if (!auth.isAuthenticated()) {
      router.replace(`/login?redirect=${pathname}`);
    }
  }, [pathname, router]);

  // If not authenticated, show loading while redirecting
  if (!auth.isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

