'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';
import { authApi } from '@/lib/api';
import { setUserRoles, setCurrentUserId } from '@/lib/authHelpers';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface PageWrapperProps {
  children: React.ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication and fetch roles
    const checkAuthAndFetchRoles = async () => {
      const authenticated = auth.isAuthenticated();
      
      if (!authenticated) {
        setIsAuthenticated(false);
        router.replace(`/login?redirect=${pathname}`);
        return;
      }

      setIsAuthenticated(true);

      // Always fetch user roles to ensure they're up to date
      try {
        const meData = await authApi.getMe();
        console.log('[PageWrapper] Fetched user roles:', meData.roles);
        setUserRoles(meData.roles);
        setCurrentUserId(meData.user.id);
      } catch (err) {
        console.error('Error fetching user info:', err);
        // Continue even if getMe fails
      }
    };

    checkAuthAndFetchRoles();
  }, [pathname, router]);

  // Show loading state during initial check (prevents hydration mismatch)
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // If not authenticated, show loading while redirecting
  if (!isAuthenticated) {
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

