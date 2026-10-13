'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Legacy edit route — product detail is inline-editable (FE43). */
export default function EditProductRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  useEffect(() => {
    if (id != null) {
      router.replace(`/catalog/products/${id}`);
    } else {
      router.replace('/catalog/products');
    }
  }, [id, router]);

  return <p className="text-sm text-gray-500">Redirecting…</p>;
}
