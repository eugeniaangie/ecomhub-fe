'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProductForm } from '@/components/catalog/ProductForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { canWriteProduct } from '@/lib/authHelpers';
import { productsApi } from '@/lib/services/productsApi';
import type {
  ProductDetail,
  ProductForm as ProductFormBody,
} from '@/lib/types/product';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const canWrite = canWriteProduct();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Edit product · Catalog · EcomHub';
  }, []);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setLoadError('Invalid product ID');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const detail = await productsApi.getById(id);
        if (!cancelled) setProduct(detail);
      } catch (err: unknown) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load product'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!canWrite) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Edit product"
          parent={{ label: 'Products', href: '/catalog/products' }}
        />
        <p className="text-sm text-gray-600">
          You do not have permission to edit products.
        </p>
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  if (loadError || !product) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Edit product"
          parent={{ label: 'Products', href: '/catalog/products' }}
        />
        <p className="text-sm text-red-600">{loadError || 'Product not found'}</p>
      </div>
    );
  }

  const handleSubmit = async (body: ProductFormBody) => {
    setIsSubmitting(true);
    setError('');
    try {
      await productsApi.update(id, body);
      router.push(`/catalog/products/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit · ${product.product_name}`}
        description="Options and variants are add-only — existing rows keep their ids; removals are not supported."
        parent={{ label: 'Products', href: `/catalog/products/${id}` }}
      />
      <ProductForm
        mode="edit"
        initial={product}
        isSubmitting={isSubmitting}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/catalog/products/${id}`)}
      />
    </div>
  );
}
