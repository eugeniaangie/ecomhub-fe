'use client';

import type { ShopeeConnectedShop } from '@/lib/services/integrationsApi';

/** Shared connected-shop block — matches first-time OAuth callback success UI. */
export function ShopeeShopStatus({ shop }: { shop: ShopeeConnectedShop }) {
  return (
    <div className="space-y-3 text-sm text-gray-700">
      <p className="font-medium text-green-700">Shop connected. Tokens stored on the server.</p>
      <dl className="grid gap-2 sm:grid-cols-[8rem_1fr]">
        <dt className="text-gray-500">shop_id</dt>
        <dd className="font-mono">{shop.shop_id}</dd>
        <dt className="text-gray-500">account id</dt>
        <dd className="font-mono">{shop.id}</dd>
        <dt className="text-gray-500">token expires</dt>
        <dd className="font-mono break-all">{shop.token_expires_at}</dd>
      </dl>
    </div>
  );
}
