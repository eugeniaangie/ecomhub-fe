'use client';

import Link from 'next/link';

/** Optional F8h catalog link fields on a SKU / item line. */
export type CatalogSkuLink = {
  sku?: string | null;
  product_id?: number | null;
};

type Props = {
  row: CatalogSkuLink;
  /** Extra classes for the SKU text / link. */
  className?: string;
};

/**
 * Renders a Sales SKU. When Core F8h linked `product_id`, link to Catalog › Product.
 */
export function CatalogSkuCell({ row, className = '' }: Props) {
  const sku = (row.sku || '').trim() || '—';
  const productId =
    row.product_id != null && row.product_id > 0 ? row.product_id : null;

  if (!productId) {
    return (
      <span className={`font-mono text-gray-900 ${className}`.trim()}>
        {sku}
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      <Link
        href={`/catalog/products/${productId}`}
        className="font-mono text-blue-700 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {sku}
      </Link>
      <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-green-800">
        Catalog
      </span>
    </span>
  );
}
