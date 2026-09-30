'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { shopeeAuthApi, type ShopeeConnectedShop } from '@/lib/services/integrationsApi';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { ShopeeShopStatus } from '@/components/integrations/ShopeeShopStatus';

const LAST_SHOP_KEY = 'shopee_oauth_last_shop';

type Phase =
  | { kind: 'missing' }
  | { kind: 'incomplete'; code: boolean; shopId: boolean }
  | { kind: 'exchanging'; shopId: string }
  | { kind: 'connected'; shop: ShopeeConnectedShop }
  | { kind: 'error'; message: string; shopId: string };

function readCachedShop(): ShopeeConnectedShop | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(LAST_SHOP_KEY);
    if (!raw) return null;
    const shop = JSON.parse(raw) as ShopeeConnectedShop;
    if (typeof shop?.id !== 'number' || typeof shop?.shop_id !== 'number') return null;
    return shop;
  } catch {
    return null;
  }
}

function ShopeeAuthCallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code')?.trim() || '';
  const shopIdRaw = searchParams.get('shop_id')?.trim() || '';
  const started = useRef(false);
  const [phase, setPhase] = useState<Phase>(() => {
    if (!code && !shopIdRaw) {
      const cached = readCachedShop();
      if (cached) return { kind: 'connected', shop: cached };
      return { kind: 'missing' };
    }
    if (!code || !shopIdRaw) {
      return { kind: 'incomplete', code: Boolean(code), shopId: Boolean(shopIdRaw) };
    }
    const shopIdNum = Number(shopIdRaw);
    if (!Number.isFinite(shopIdNum) || shopIdNum <= 0) {
      return {
        kind: 'error',
        shopId: shopIdRaw,
        message: 'shop_id must be a positive number',
      };
    }
    return { kind: 'exchanging', shopId: shopIdRaw };
  });

  useEffect(() => {
    document.title = 'Shopee callback · EcomHub';
  }, []);

  useEffect(() => {
    if (phase.kind !== 'exchanging' || started.current) return;
    const shopIdNum = Number(shopIdRaw);
    started.current = true;
    let cancelled = false;
    (async () => {
      try {
        const shop = await shopeeAuthApi.exchangeToken(code, shopIdNum);
        if (cancelled) return;
        try {
          sessionStorage.setItem(LAST_SHOP_KEY, JSON.stringify(shop));
        } catch {
          // ignore quota / private mode
        }
        // Drop one-time code from the URL so refresh does not re-POST a spent code.
        window.history.replaceState(null, '', '/shopee-auth-callback');
        setPhase({ kind: 'connected', shop });
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Token exchange failed';
        if (!cancelled) setPhase({ kind: 'error', message, shopId: shopIdRaw });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase.kind, code, shopIdRaw]);

  return (
    <div className="space-y-6">
      <PageHeader title="Shopee authorization" />

      <Card title="Callback result">
        {phase.kind === 'exchanging' ? (
          <p className="text-sm text-gray-600">Connecting shop {phase.shopId}…</p>
        ) : phase.kind === 'connected' ? (
          <ShopeeShopStatus shop={phase.shop} />
        ) : phase.kind === 'error' ? (
          <div className="space-y-2 text-sm text-red-700">
            <p className="font-medium">Could not complete token exchange</p>
            <p>{phase.message}</p>
            <p className="text-gray-600">
              The authorization code is single-use. Refreshing this page after a successful
              connect reuses a spent code and will fail. Use{' '}
              <Link href="/integrations/shopee" className="text-blue-600 hover:underline">
                Connect Shopee
              </Link>{' '}
              again only if you need a new authorization.
            </p>
          </div>
        ) : phase.kind === 'incomplete' ? (
          <p className="text-sm text-amber-700">
            Query is incomplete — need both <code className="font-mono">code</code> and{' '}
            <code className="font-mono">shop_id</code>. Got code={phase.code ? 'yes' : 'no'},
            shop_id={phase.shopId ? 'yes' : 'no'}.
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            No <code className="font-mono">code</code> or{' '}
            <code className="font-mono">shop_id</code> in the URL. Open{' '}
            <Link href="/integrations/shopee" className="text-blue-600 hover:underline">
              Integrations → Shopee
            </Link>{' '}
            to connect or view status.
          </p>
        )}
      </Card>

      <p className="text-sm">
        <Link href="/integrations/shopee" className="text-blue-600 hover:underline">
          Back to Shopee Connect
        </Link>
      </p>
    </div>
  );
}

export default function ShopeeAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
          Loading callback…
        </div>
      }
    >
      <ShopeeAuthCallbackContent />
    </Suspense>
  );
}
