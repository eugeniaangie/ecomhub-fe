'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductForm } from '@/components/catalog/ProductForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { canWriteProduct } from '@/lib/authHelpers';
import { productsApi } from '@/lib/services/productsApi';
import type { ProductForm as ProductFormBody } from '@/lib/types/product';
import {
  buildProductCopySeed,
  type ProductCopySeed,
} from '@/lib/utils/productCopy';

function NewProductPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyFromRaw = searchParams.get('copy_from');
  const copyFromId = copyFromRaw ? Number(copyFromRaw) : NaN;
  const canWrite = canWriteProduct();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copyLoading, setCopyLoading] = useState(
    Boolean(copyFromRaw && !Number.isNaN(copyFromId) && copyFromId > 0)
  );
  const [copySeed, setCopySeed] = useState<ProductCopySeed | null>(null);
  const [copySourceName, setCopySourceName] = useState('');

  useEffect(() => {
    document.title = copySeed
      ? 'Copy product · Catalog · EcomHub'
      : 'New product · Catalog · EcomHub';
  }, [copySeed]);

  useEffect(() => {
    if (!copyFromRaw || Number.isNaN(copyFromId) || copyFromId <= 0) {
      setCopyLoading(false);
      setCopySeed(null);
      setCopySourceName('');
      return;
    }
    let cancelled = false;
    (async () => {
      setCopyLoading(true);
      setError('');
      try {
        const detail = await productsApi.getById(copyFromId);
        if (cancelled) return;
        setCopySeed(buildProductCopySeed(detail));
        setCopySourceName(detail.product_name);
      } catch (err: unknown) {
        if (cancelled) return;
        setCopySeed(null);
        setCopySourceName('');
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load product to copy'
        );
      } finally {
        if (!cancelled) setCopyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [copyFromRaw, copyFromId]);

  if (!canWrite) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="New product"
          parent={{ label: 'Products', href: '/catalog/products' }}
        />
        <p className="text-sm text-gray-600">
          You do not have permission to create products.
        </p>
      </div>
    );
  }

  const handleSubmit = async (body: ProductFormBody) => {
    setIsSubmitting(true);
    setError('');
    try {
      const created = await productsApi.create({
        ...body,
        status: body.status || 'draft',
      });
      router.push(`/catalog/products/${created.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
      setIsSubmitting(false);
    }
  };

  const isCopy = Boolean(copySeed);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCopy ? 'Copy product' : 'New product'}
        description={
          isCopy
            ? 'Review the prefilled draft, then save. Images and Shopee listings are not copied.'
            : 'Create a draft product with optional options and variants.'
        }
        parent={{ label: 'Products', href: '/catalog/products' }}
      />

      {copyLoading ? (
        <p className="text-sm text-gray-500">Loading product to copy…</p>
      ) : (
        <ProductForm
          key={
            copySeed
              ? `copy-${copyFromId}-${copySeed.product_name}`
              : 'create'
          }
          mode="create"
          copySeed={copySeed}
          copySourceName={copySourceName || undefined}
          isSubmitting={isSubmitting}
          error={error}
          submitLabel={isCopy ? 'Create copy' : 'Create'}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/catalog/products')}
        />
      )}
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-gray-500">Loading…</p>
      }
    >
      <NewProductPageInner />
    </Suspense>
  );
}
