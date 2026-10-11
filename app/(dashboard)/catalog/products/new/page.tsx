'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductForm } from '@/components/catalog/ProductForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { canWriteProduct } from '@/lib/authHelpers';
import { productsApi } from '@/lib/services/productsApi';
import type { ProductForm as ProductFormBody } from '@/lib/types/product';

export default function NewProductPage() {
  const router = useRouter();
  const canWrite = canWriteProduct();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'New product · Catalog · EcomHub';
  }, []);

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
      const created = await productsApi.create(body);
      router.push(`/catalog/products/${created.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New product"
        description="Create a draft product with optional options and variants."
        parent={{ label: 'Products', href: '/catalog/products' }}
      />
      <ProductForm
        mode="create"
        isSubmitting={isSubmitting}
        error={error}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/catalog/products')}
      />
    </div>
  );
}
