'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/finance/StatusBadge';
import { canWriteProduct } from '@/lib/authHelpers';
import { productsApi } from '@/lib/services/productsApi';
import type {
  ListingSyncStatus,
  ProductDetail,
  ProductStatus,
} from '@/lib/types/product';
import {
  PRODUCT_STATUS_COLORS,
  PRODUCT_STATUS_LABELS,
  SYNC_STATUS_COLORS,
  SYNC_STATUS_LABELS,
  variantOptionLabels,
} from '@/lib/utils/productLabels';

export default function ProductDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const canWrite = canWriteProduct();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [skuEdits, setSkuEdits] = useState<Record<number, string>>({});
  const [skuSaving, setSkuSaving] = useState<number | null>(null);
  const [skuError, setSkuError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) {
      setError('Invalid product ID');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const detail = await productsApi.getById(id);
      setProduct(detail);
      const edits: Record<number, string> = {};
      for (const v of detail.variants ?? []) {
        edits[v.id] = v.sku;
      }
      setSkuEdits(edits);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (product) {
      document.title = `${product.product_name} · Catalog · EcomHub`;
    } else {
      document.title = 'Product · Catalog · EcomHub';
    }
  }, [product]);

  const saveSku = async (variantId: number) => {
    if (!product) return;
    const sku = (skuEdits[variantId] ?? '').trim();
    if (!sku) {
      setSkuError('SKU is required.');
      return;
    }
    setSkuSaving(variantId);
    setSkuError('');
    try {
      await productsApi.updateVariant(product.id, variantId, { sku });
      await load();
    } catch (err: unknown) {
      setSkuError(err instanceof Error ? err.message : 'Failed to update SKU');
    } finally {
      setSkuSaving(null);
    }
  };

  const onUpload = async (file: File | null) => {
    if (!file || !product) return;
    setUploading(true);
    setImageError('');
    try {
      await productsApi.uploadImage(product.id, file);
      await load();
    } catch (err: unknown) {
      setImageError(
        err instanceof Error ? err.message : 'Failed to upload image'
      );
    } finally {
      setUploading(false);
    }
  };

  const setPrimary = async (imageId: number) => {
    if (!product?.images?.length) return;
    const ordered = [...product.images].sort((a, b) => a.position - b.position);
    const ids = ordered.map((img) => img.id);
    setImageError('');
    try {
      await productsApi.reorderImages(product.id, {
        image_ids: ids,
        primary_image_id: imageId,
      });
      await load();
    } catch (err: unknown) {
      setImageError(
        err instanceof Error ? err.message : 'Failed to set primary image'
      );
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  if (error || !product) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Product"
          parent={{ label: 'Products', href: '/catalog/products' }}
        />
        <p className="text-sm text-red-600">{error || 'Product not found'}</p>
      </div>
    );
  }

  const status = (product.status || 'draft') as ProductStatus;

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.product_name}
        description={
          product.product_code
            ? `Code ${product.product_code}`
            : 'No product code'
        }
        parent={{ label: 'Products', href: '/catalog/products' }}
        actions={
          canWrite ? (
            <Link href={`/catalog/products/${product.id}/edit`}>
              <Button>Edit</Button>
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Overview" className="lg:col-span-2">
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd className="mt-1">
                <StatusBadge
                  label={PRODUCT_STATUS_LABELS[status] || product.status}
                  colorClass={
                    PRODUCT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
                  }
                />
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Brand</dt>
              <dd className="mt-1 text-gray-900">{product.brand || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Category ID</dt>
              <dd className="mt-1 text-gray-900">
                {product.category_id ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Weight</dt>
              <dd className="mt-1 text-gray-900">
                {product.weight_kg != null ? `${product.weight_kg} kg` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Package (L×W×H cm)</dt>
              <dd className="mt-1 text-gray-900">
                {product.package_length_cm != null ||
                product.package_width_cm != null ||
                product.package_height_cm != null
                  ? `${product.package_length_cm ?? '—'} × ${product.package_width_cm ?? '—'} × ${product.package_height_cm ?? '—'}`
                  : '—'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500">Description</dt>
              <dd className="mt-1 whitespace-pre-wrap text-gray-900">
                {product.description || '—'}
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Images">
          {imageError && (
            <p className="mb-2 text-sm text-red-600">{imageError}</p>
          )}
          <div className="mb-3 flex flex-wrap gap-2">
            {(product.images ?? []).length === 0 ? (
              <p className="text-sm text-gray-600">No images yet.</p>
            ) : (
              product.images.map((img) => (
                <div key={img.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url || img.media?.image_url || ''}
                    alt=""
                    className={`h-20 w-20 rounded border object-cover ${
                      img.is_primary ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                    }`}
                  />
                  {canWrite && !img.is_primary && (
                    <button
                      type="button"
                      className="mt-1 block w-full cursor-pointer text-center text-xs text-blue-600 hover:underline"
                      onClick={() => setPrimary(img.id)}
                    >
                      Set primary
                    </button>
                  )}
                  {img.is_primary && (
                    <p className="mt-1 text-center text-xs text-gray-600">
                      Primary
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
          {canWrite && (
            <div className="space-y-2">
              <label
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50 ${
                  uploading ? 'pointer-events-none opacity-60' : ''
                }`}
              >
                <span className="text-sm font-medium text-gray-900">
                  {uploading ? 'Uploading…' : 'Click to upload image'}
                </span>
                <span className="mt-1 text-xs text-gray-600">
                  JPEG / PNG / WebP, max 5 MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
            </div>
          )}
        </Card>
      </div>

      <Card title="Options">
        {(product.options ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">No options (single SKU).</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {product.options.map((opt) => (
              <li key={opt.id}>
                <p className="font-medium text-gray-900">{opt.option_name}</p>
                <p className="text-gray-600">
                  {(opt.values ?? []).map((v) => v.option_value).join(', ') ||
                    '—'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Variants">
        {skuError && <p className="mb-2 text-sm text-red-600">{skuError}</p>}
        {(product.variants ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">No variants.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="px-2 py-2">Options</th>
                  <th className="px-2 py-2">SKU</th>
                  <th className="px-2 py-2">Source</th>
                  {canWrite && <th className="px-2 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {product.variants.map((v) => (
                  <tr key={v.id}>
                    <td className="px-2 py-2 text-gray-700">
                      {variantOptionLabels(v, product.options ?? [])}
                    </td>
                    <td className="px-2 py-2">
                      {canWrite ? (
                        <Input
                          value={skuEdits[v.id] ?? v.sku}
                          onChange={(e) =>
                            setSkuEdits((prev) => ({
                              ...prev,
                              [v.id]: e.target.value,
                            }))
                          }
                          placeholder="e.g. KAOS-HITAM-M"
                        />
                      ) : (
                        <span className="font-mono text-gray-900">{v.sku}</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-gray-600">{v.sku_source}</td>
                    {canWrite && (
                      <td className="px-2 py-2 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          isLoading={skuSaving === v.id}
                          disabled={
                            (skuEdits[v.id] ?? '').trim() === v.sku ||
                            skuSaving != null
                          }
                          onClick={() => saveSku(v.id)}
                        >
                          Save SKU
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Channel listings">
        {(product.listings ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">
            No channel listings yet. Import from Shopee or push later (FE39).
          </p>
        ) : (
          <div className="space-y-4">
            {product.listings.map((listing) => {
              const sync = (listing.sync_status ||
                'not_published') as ListingSyncStatus;
              return (
                <div
                  key={listing.id}
                  className="rounded-md border border-gray-100 bg-gray-50 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={SYNC_STATUS_LABELS[sync] || listing.sync_status}
                      colorClass={
                        SYNC_STATUS_COLORS[sync] || 'bg-gray-100 text-gray-800'
                      }
                    />
                    <span className="text-gray-900">
                      Account #{listing.marketplace_account_id}
                    </span>
                  </div>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-gray-500">External product ID</dt>
                      <dd className="mt-0.5 font-mono text-gray-900">
                        {listing.external_product_id || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">External status</dt>
                      <dd className="mt-0.5 text-gray-900">
                        {listing.external_status || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">External SKU</dt>
                      <dd className="mt-0.5 text-gray-900">
                        {listing.external_sku || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Last synced</dt>
                      <dd className="mt-0.5 text-gray-900">
                        {listing.last_synced_at
                          ? new Date(listing.last_synced_at).toLocaleString()
                          : '—'}
                      </dd>
                    </div>
                    {listing.last_push_error && (
                      <div className="sm:col-span-2">
                        <dt className="text-gray-500">Last push error</dt>
                        <dd className="mt-0.5 text-red-700">
                          {listing.last_push_error}
                        </dd>
                      </div>
                    )}
                  </dl>
                  {(listing.variants ?? []).length > 0 && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="min-w-full text-xs text-gray-900">
                        <thead>
                          <tr className="text-left text-gray-500">
                            <th className="py-1 pr-2">Variant</th>
                            <th className="py-1 pr-2">Ext. SKU</th>
                            <th className="py-1 pr-2">Price</th>
                            <th className="py-1">Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listing.variants.map((lv) => (
                            <tr
                              key={lv.id}
                              className="border-t border-gray-200"
                            >
                              <td className="py-1 pr-2 text-gray-900">
                                #{lv.product_variant_id}
                              </td>
                              <td className="py-1 pr-2 text-gray-900">
                                {lv.external_sku || '—'}
                              </td>
                              <td className="py-1 pr-2 text-gray-900">
                                {lv.external_price != null
                                  ? `${lv.external_price}${lv.currency ? ` ${lv.currency}` : ''}`
                                  : '—'}
                              </td>
                              <td className="py-1 text-gray-900">
                                {lv.external_stock ?? '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
