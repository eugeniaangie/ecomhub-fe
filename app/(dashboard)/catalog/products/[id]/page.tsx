'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductForm } from '@/components/catalog/ProductForm';
import { ProductImageGallery } from '@/components/catalog/ProductImageGallery';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/finance/StatusBadge';
import { canWriteProduct } from '@/lib/authHelpers';
import { productsApi } from '@/lib/services/productsApi';
import type {
  ListingSyncStatus,
  ProductDetail,
  ProductForm as ProductFormBody,
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
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const canWrite = canWriteProduct();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSave = async (
    body: ProductFormBody,
    extras: { skuUpdates: { variantId: number; sku: string }[] }
  ) => {
    setIsSubmitting(true);
    setSaveError('');
    try {
      await productsApi.update(id, body);
      for (const u of extras.skuUpdates) {
        await productsApi.updateVariant(id, u.variantId, { sku: u.sku });
      }
      await load();
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save product'
      );
    } finally {
      setIsSubmitting(false);
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
          canWrite
            ? 'Edit fields below and save. Delete/remove is not available yet.'
            : product.product_code
              ? `Code ${product.product_code}`
              : 'No product code'
        }
        parent={{ label: 'Products', href: '/catalog/products' }}
      />

      {canWrite ? (
        <>
          <ProductForm
            key={`${product.id}-${product.updated_at}`}
            mode="edit"
            initial={product}
            isSubmitting={isSubmitting}
            error={saveError}
            cancelLabel="Back to list"
            submitLabel="Save"
            onSubmit={handleSave}
            onCancel={() => router.push('/catalog/products')}
          />
          <ProductImageGallery
            images={product.images ?? []}
            canWrite
            uploading={uploading}
            error={imageError}
            onUpload={onUpload}
            onSetPrimary={setPrimary}
          />
        </>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Overview" className="lg:col-span-2">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge
                      label={PRODUCT_STATUS_LABELS[status] || product.status}
                      colorClass={
                        PRODUCT_STATUS_COLORS[status] ||
                        'bg-gray-100 text-gray-800'
                      }
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Brand</dt>
                  <dd className="mt-1 text-gray-900">{product.brand || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Product code</dt>
                  <dd className="mt-1 text-gray-900">
                    {product.product_code || '—'}
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
            <ProductImageGallery
              images={product.images ?? []}
              canWrite={false}
              onUpload={() => undefined}
              onSetPrimary={() => undefined}
            />
          </div>
          <Card title="Variants">
            {(product.variants ?? []).length === 0 ? (
              <p className="text-sm text-gray-600">No variants.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500">
                    <th className="px-2 py-2">Options</th>
                    <th className="px-2 py-2">SKU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {product.variants.map((v) => (
                    <tr key={v.id}>
                      <td className="px-2 py-2 text-gray-900">
                        {variantOptionLabels(v, product.options ?? [])}
                      </td>
                      <td className="px-2 py-2 font-mono text-gray-900">
                        {v.sku}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      <Card title="Channel listings">
        {(product.listings ?? []).length === 0 ? (
          <p className="text-sm text-gray-600">
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
