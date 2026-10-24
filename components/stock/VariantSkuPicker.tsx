'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { productsApi } from '@/lib/services/productsApi';
import type { Product, ProductVariantDetail } from '@/lib/types/product';

export type PickedVariant = {
  product_variant_id: number;
  sku: string;
  product_name: string;
};

type Props = {
  value: PickedVariant | null;
  onChange: (v: PickedVariant | null) => void;
  disabled?: boolean;
};

/**
 * Search Catalog products by name/code/SKU, then pick a variant.
 * Uses existing product APIs — no invented stock-search endpoint.
 */
export function VariantSkuPicker({ value, onChange, disabled }: Props) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariantDetail[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );

  const runSearch = async () => {
    const q = query.trim();
    if (!q) {
      setError('Enter a product name, code, or SKU fragment');
      return;
    }
    setBusy(true);
    setError('');
    setProducts([]);
    setVariants([]);
    setSelectedProductId(null);
    onChange(null);
    try {
      const data = await productsApi.getList({
        page: 1,
        limit: 20,
        search: q,
      });
      setProducts(data?.results ?? []);
      if (!(data?.results?.length)) {
        setError('No products matched');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setBusy(false);
    }
  };

  const pickProduct = async (productId: number) => {
    setBusy(true);
    setError('');
    setSelectedProductId(productId);
    setVariants([]);
    onChange(null);
    try {
      const detail = await productsApi.getById(productId);
      setVariants(detail?.variants ?? []);
      if (!(detail?.variants?.length)) {
        setError('Product has no variants');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load variants');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <Input
            label="Find variant (product search)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void runSearch();
              }
            }}
            placeholder="Name, code, or SKU"
            disabled={disabled || busy}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || busy}
          isLoading={busy}
          onClick={() => void runSearch()}
        >
          Search
        </Button>
      </div>

      {error ? (
        <p className="text-xs text-red-700">{error}</p>
      ) : null}

      {value ? (
        <p className="rounded border border-green-100 bg-green-50 px-2 py-1 text-xs text-green-900">
          Selected{' '}
          <span className="font-mono">{value.sku}</span> · {value.product_name}{' '}
          (variant #{value.product_variant_id})
          <button
            type="button"
            className="ml-2 cursor-pointer text-sky-700 underline"
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            Clear
          </button>
        </p>
      ) : null}

      {products.length > 0 && !value ? (
        <ul className="max-h-36 space-y-1 overflow-auto rounded border border-gray-100 p-2 text-xs">
          {products.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                disabled={disabled || busy}
                onClick={() => void pickProduct(p.id)}
                className={`w-full cursor-pointer rounded px-2 py-1 text-left hover:bg-gray-50 ${
                  selectedProductId === p.id ? 'bg-sky-50' : ''
                }`}
              >
                {p.name}
                {p.code ? (
                  <span className="text-gray-500"> · {p.code}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {variants.length > 0 && !value ? (
        <ul className="max-h-36 space-y-1 overflow-auto rounded border border-gray-100 p-2 text-xs">
          {variants.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                disabled={disabled || busy}
                onClick={() =>
                  onChange({
                    product_variant_id: v.id,
                    sku: v.sku,
                    product_name:
                      products.find((p) => p.id === selectedProductId)?.name ||
                      '',
                  })
                }
                className="w-full cursor-pointer rounded px-2 py-1 text-left font-mono hover:bg-gray-50"
              >
                {v.sku}{' '}
                <span className="font-sans text-gray-500">#{v.id}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
