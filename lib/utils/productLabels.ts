import type {
  ListingSyncStatus,
  ProductOptionDetail,
  ProductStatus,
  ProductVariantDetail,
} from '../types/product';

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Draft',
  active: 'Active',
};

export const PRODUCT_STATUS_COLORS: Record<ProductStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
};

export const SYNC_STATUS_LABELS: Record<ListingSyncStatus, string> = {
  not_published: 'Not published',
  in_sync: 'In sync',
  pending_changes: 'Pending changes',
  push_failed: 'Push failed',
  conflict: 'Conflict',
};

export const SYNC_STATUS_COLORS: Record<ListingSyncStatus, string> = {
  not_published: 'bg-gray-100 text-gray-700',
  in_sync: 'bg-green-100 text-green-800',
  pending_changes: 'bg-amber-100 text-amber-900',
  push_failed: 'bg-red-100 text-red-800',
  conflict: 'bg-orange-100 text-orange-900',
};

export const IMPORT_STATUS_LABELS: Record<string, string> = {
  created: 'Created',
  updated: 'Updated',
  skipped_kit: 'Skipped (kit)',
  failed: 'Failed',
};

export const IMPORT_STATUS_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-800',
  updated: 'bg-blue-100 text-blue-800',
  skipped_kit: 'bg-gray-100 text-gray-700',
  failed: 'bg-red-100 text-red-800',
};

/** Resolve variant option_value ids to display labels via product options. */
export function variantOptionLabels(
  variant: ProductVariantDetail,
  options: ProductOptionDetail[]
): string {
  if (!variant.option_values?.length) return '—';
  const parts = variant.option_values.map((ov) => {
    const option = options.find((o) => o.id === ov.product_option_id);
    const value = option?.values?.find(
      (v) => v.id === ov.product_option_value_id
    );
    if (option && value) return `${option.option_name}: ${value.option_value}`;
    return `#${ov.product_option_value_id}`;
  });
  return parts.join(' · ');
}
