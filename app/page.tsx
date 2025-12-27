'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (auth.isAuthenticated()) {
      // Redirect to dashboard if logged in
      router.replace('/dashboard');
    } else {
      // Redirect to login if not logged in
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-gray-500">Redirecting...</div>
    </div>
  );
}

