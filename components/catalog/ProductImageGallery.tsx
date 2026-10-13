'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ProductImageDetail } from '@/lib/types/product';

export interface ProductImageGalleryProps {
  images: ProductImageDetail[];
  canWrite: boolean;
  uploading?: boolean;
  error?: string;
  onUpload: (file: File | null) => void;
  onSetPrimary: (imageId: number) => void;
}

export function ProductImageGallery({
  images,
  canWrite,
  uploading = false,
  error = '',
  onUpload,
  onSetPrimary,
}: ProductImageGalleryProps) {
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!zoomUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomUrl(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [zoomUrl]);

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Images</h2>
        <p className="text-xs text-gray-600">
          Click an image to zoom. Removal is not available yet (Core deferred).
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {images.length === 0 ? (
          <p className="text-sm text-gray-600">No images yet.</p>
        ) : (
          images.map((img) => {
            const src = img.image_url || img.media?.image_url || '';
            return (
              <div key={img.id} className="w-24">
                <button
                  type="button"
                  className={`group relative block h-24 w-24 overflow-hidden rounded border bg-gray-100 ${
                    img.is_primary
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200'
                  }`}
                  style={{ cursor: 'zoom-in' }}
                  onClick={() => src && setZoomUrl(src)}
                  aria-label="Zoom image"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
                    <svg
                      className="h-7 w-7 text-white drop-shadow"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16zM11 8v6M8 11h6"
                      />
                    </svg>
                  </span>
                </button>
                {canWrite && !img.is_primary ? (
                  <button
                    type="button"
                    className="mt-1 block w-full cursor-pointer text-center text-xs text-blue-600 hover:underline"
                    onClick={() => onSetPrimary(img.id)}
                  >
                    Set primary
                  </button>
                ) : null}
                {img.is_primary ? (
                  <p className="mt-1 text-center text-xs text-gray-600">
                    Primary
                  </p>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {canWrite ? (
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
      ) : null}

      {zoomUrl ? (
        <div
          className="fixed inset-0 z-60 flex cursor-zoom-out items-center justify-center bg-black/70 p-4"
          onClick={() => setZoomUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomUrl}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded object-contain shadow-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute right-4 top-4 cursor-pointer"
            onClick={() => setZoomUrl(null)}
          >
            Close
          </Button>
        </div>
      ) : null}
    </section>
  );
}
