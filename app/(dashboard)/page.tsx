'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** App home → ops Dashboard (not Finance). */
export default function RootDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-gray-500">Redirecting…</div>
    </div>
  );
}
