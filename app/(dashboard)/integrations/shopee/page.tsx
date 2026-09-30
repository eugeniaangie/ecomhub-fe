'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { canConnectShopeeShop } from '@/lib/authHelpers';
import { shopeeAuthApi } from '@/lib/services/integrationsApi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ShopeeConnectPage() {
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const canConnect = canConnectShopeeShop();

  useEffect(() => {
    document.title = 'Shopee · Integrations · EcomHub';
  }, []);

  const handleConnect = async () => {
    setError('');
    setIsConnecting(true);
    try {
      const data = await shopeeAuthApi.getAuthorizeUrl();
      const url = data?.authorize_url?.trim();
      if (!url) {
        setError('Authorize URL was empty. Check Shopee API config on the server.');
        setIsConnecting(false);
        return;
      }
      // Same-tab redirect so Shopee returns to /shopee-auth-callback in this session.
      window.location.assign(url);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to get Shopee authorize URL';
      setError(message);
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          <Link href="/integrations" className="hover:text-gray-800 hover:underline">
            Integrations
          </Link>
          <span className="mx-1.5">/</span>
          Shopee
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900">Shopee</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Connect a shop through Shopee Partner OAuth. After you approve on Shopee, you land
          back on the callback page with a one-time code. Token storage is not wired yet
          (Core F6a3).
        </p>
      </div>

      <Card title="Shop connection">
        {!canConnect ? (
          <p className="text-sm text-gray-600">
            Connecting a Shopee shop requires an admin or superadmin account. Ask an admin
            to run Connect Shopee.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Opens Shopee&apos;s authorization page. Use the Partner credentials configured
              on the API (`CLIENT_SHOPEE_API_*`). Redirect target is the locked FE callback
              path.
            </p>
            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <Button onClick={handleConnect} isLoading={isConnecting}>
              Connect Shopee
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
