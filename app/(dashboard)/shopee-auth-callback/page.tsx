'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { shopeeAuthApi, type ShopeeConnectedShop } from '@/lib/services/integrationsApi';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';

type Phase =
  | { kind: 'missing' }
  | { kind: 'incomplete'; code: boolean; shopId: boolean }
  | { kind: 'exchanging'; shopId: string }
  | { kind: 'connected'; shop: ShopeeConnectedShop }
  | { kind: 'error'; message: string; shopId: string };

function ShopeeAuthCallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code')?.trim() || '';
  const shopIdRaw = searchParams.get('shop_id')?.trim() || '';
  const started = useRef(false);
  const [phase, setPhase] = useState<Phase>(() => {
    if (!code && !shopIdRaw) return { kind: 'missing' };
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
        if (!cancelled) setPhase({ kind: 'connected', shop });
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
      <PageHeader
        title="Shopee authorization"
        description="Finishing shop connection: exchanging the authorization code for API tokens (stored on the server)."
      />

      <Card title="Callback result">
        {phase.kind === 'exchanging' ? (
          <p className="text-sm text-gray-600">Connecting shop {phase.shopId}…</p>
        ) : phase.kind === 'connected' ? (
          <div className="space-y-3 text-sm text-gray-700">
            <p className="font-medium text-green-700">Shop connected. Tokens stored on the server.</p>
            <dl className="grid gap-2 sm:grid-cols-[8rem_1fr]">
              <dt className="text-gray-500">shop_id</dt>
              <dd className="font-mono">{phase.shop.shop_id}</dd>
              <dt className="text-gray-500">account id</dt>
              <dd className="font-mono">{phase.shop.id}</dd>
              <dt className="text-gray-500">token expires</dt>
              <dd className="font-mono break-all">{phase.shop.token_expires_at}</dd>
            </dl>
            <p className="text-gray-500">
              Access tokens refresh automatically when we call Shopee later. Re-run Connect only if
              the shop is disconnected.
            </p>
          </div>
        ) : phase.kind === 'error' ? (
          <div className="space-y-2 text-sm text-red-700">
            <p className="font-medium">Could not complete token exchange</p>
            <p>{phase.message}</p>
            <p className="text-gray-600">
              The authorization code is single-use and expires quickly. Use{' '}
              <Link href="/integrations/shopee" className="text-blue-600 hover:underline">
                Connect Shopee
              </Link>{' '}
              again if needed.
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
            and run Connect Shopee again.
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
