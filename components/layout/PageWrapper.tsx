'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ensureAccessToken, authApi } from '@/lib/api';
import { setUserRoles, setCurrentUserId } from '@/lib/authHelpers';
import { AppNav } from './AppNav';
import { TenantProvider, useTenant } from './TenantProvider';

interface PageWrapperProps {
  children: React.ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  return (
    <TenantProvider>
      <PageWrapperInner>{children}</PageWrapperInner>
    </TenantProvider>
  );
};

const PageWrapperInner: React.FC<PageWrapperProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrateFromMe, canMutate, ready } = useTenant();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthAndFetchRoles = async () => {
      const ok = await ensureAccessToken();

      if (!ok) {
        setIsAuthenticated(false);
        const redirect = encodeURIComponent(pathname || '/');
        router.replace(`/login?redirect=${redirect}`);
        return;
      }

      setIsAuthenticated(true);

      try {
        const meData = await authApi.getMe();
        setUserRoles(meData.roles);
        setCurrentUserId(meData.user.id);
        hydrateFromMe(meData);
      } catch (err) {
        console.error('Error fetching user info:', err);
      }
    };

    checkAuthAndFetchRoles();
  }, [pathname, router, hydrateFromMe]);

  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <AppNav />
      {ready && !canMutate ? (
        <div
          className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-center text-sm text-amber-900"
          role="status"
        >
          Belum di-assign ke toko — tampilan view-only. Hubungi superadmin untuk
          assignment.
        </div>
      ) : null}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
};
