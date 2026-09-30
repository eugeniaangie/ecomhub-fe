'use client';

import { Suspense, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';

function ShopeeAuthCallbackContent() {
  const searchParams = useSearchParams();

  const code = searchParams.get('code')?.trim() || '';
  const shopId = searchParams.get('shop_id')?.trim() || '';

  const status = useMemo(() => {
    if (code && shopId) return 'captured' as const;
    if (code || shopId) return 'incomplete' as const;
    return 'missing' as const;
  }, [code, shopId]);

  useEffect(() => {
    document.title = 'Shopee callback · EcomHub';
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shopee authorization"
        description="Shopee redirected here after shop approval. The authorization code is held on this page until Core token exchange (F6a3) is available — nothing is posted to the API yet."
      />

      <Card title="Callback result">
        {status === 'captured' ? (
          <div className="space-y-3 text-sm text-gray-700">
            <p className="font-medium text-green-700">
              Authorization parameters received. Ready for token exchange when F6a3 ships.
            </p>
            <dl className="grid gap-2 sm:grid-cols-[8rem_1fr]">
              <dt className="text-gray-500">shop_id</dt>
              <dd className="font-mono break-all">{shopId}</dd>
              <dt className="text-gray-500">code</dt>
              <dd className="font-mono break-all">{code}</dd>
            </dl>
            <p className="text-gray-500">
              Do not share the code. It is single-use and short-lived.
            </p>
          </div>
        ) : status === 'incomplete' ? (
          <p className="text-sm text-amber-700">
            Query is incomplete — need both <code className="font-mono">code</code> and{' '}
            <code className="font-mono">shop_id</code>. Got code={code ? 'yes' : 'no'},
            shop_id={shopId ? 'yes' : 'no'}.
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
