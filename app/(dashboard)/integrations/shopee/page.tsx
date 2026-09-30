'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { canConnectShopeeShop } from '@/lib/authHelpers';
import { shopeeAuthApi, type ShopeeConnectedShop } from '@/lib/services/integrationsApi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString();
}

function isExpired(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return false;
  }
  return d.getTime() <= Date.now();
}

export default function ShopeeConnectPage() {
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shops, setShops] = useState<ShopeeConnectedShop[]>([]);
  const canConnect = canConnectShopeeShop();

  const loadShops = useCallback(async () => {
    if (!canConnect) {
      setIsLoading(false);
      setShops([]);
      return;
    }
    setLoadError('');
    setIsLoading(true);
    try {
      const data = await shopeeAuthApi.listConnectedShops();
      setShops(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load connected shops';
      setLoadError(message);
      setShops([]);
    } finally {
      setIsLoading(false);
    }
  }, [canConnect]);

  useEffect(() => {
    document.title = 'Shopee · Integrations · EcomHub';
  }, []);

  useEffect(() => {
    void loadShops();
  }, [loadShops]);

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

  const activeShops = shops.filter((s) => s.is_active);
  const hasActive = activeShops.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shopee"
        description="Connect a shop through Shopee Partner OAuth. After you approve on Shopee, the callback exchanges the code for tokens and stores them on the server."
      />

      <Card title="Shop connection">
        {!canConnect ? (
          <p className="text-sm text-gray-600">
            Connecting a Shopee shop requires an admin or superadmin account. Ask an admin
            to run Connect Shopee.
          </p>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading connection status…</p>
            ) : loadError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {loadError}
              </p>
            ) : hasActive ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Connected shops are stored on the server. Access tokens refresh when we call
                  Shopee later. Use Re-connect only if the shop was disconnected or tokens were
                  revoked.
                </p>
                <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
                  {activeShops.map((shop) => {
                    const expired = isExpired(shop.token_expires_at);
                    return (
                      <li key={shop.id} className="space-y-1 px-3 py-3 text-sm">
                        <p className="font-medium text-gray-900">
                          Shop {shop.shop_id}
                          <span className="ml-2 font-normal text-gray-500">
                            (account #{shop.id})
                          </span>
                        </p>
                        <p className="text-gray-600">
                          Access token expires:{' '}
                          <span className={expired ? 'text-amber-700' : ''}>
                            {formatExpiry(shop.token_expires_at)}
                            {expired ? ' (expired — will refresh on next Shopee call)' : ''}
                          </span>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                No Shopee shop connected yet. Opens Shopee&apos;s authorization page, then returns
                to EcomHub to finish the connection.
              </p>
            )}

            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <Button onClick={handleConnect} isLoading={isConnecting}>
              {hasActive ? 'Re-connect Shopee' : 'Connect Shopee'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
