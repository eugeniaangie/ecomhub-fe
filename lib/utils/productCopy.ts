import type {
  ProductDetail,
  ProductOptionDetail,
  ProductVariantDetail,
} from '../types/product';

/** Append " (copy)" once so repeated copies do not stack the suffix. */
export function copyProductName(name: string): string {
  const base = (name || '').trim() || 'Product';
  if (/\s*\(copy\)\s*$/i.test(base)) return base;
  return `${base} (copy)`;
}

/** Option value texts for a variant, in product option order (for create body). */
export function variantOptionValueTexts(
  variant: ProductVariantDetail,
  options: ProductOptionDetail[]
): string[] {
  const sorted = [...(options ?? [])].sort((a, b) => a.position - b.position);
  return sorted.map((opt) => {
    const link = (variant.option_values ?? []).find(
      (ov) => ov.product_option_id === opt.id
    );
    if (!link) return '';
    const value = (opt.values ?? []).find(
      (v) => v.id === link.product_option_value_id
    );
    return value?.option_value ?? '';
  });
}

export type ProductCopySeed = {
  product_name: string;
  product_code: string;
  description: string;
  brand: string;
  category_id: string;
  status: 'draft';
  weight_kg: string;
  package_length_cm: string;
  package_width_cm: string;
  package_height_cm: string;
  options: { option_name: string; values: { option_value: string }[] }[];
  /** New variants for create — SKUs left blank for Core generate / operator. */
  variants: { sku: string; option_values: string[] }[];
};

/**
 * Prefill for POST /products from an existing detail.
 * Strips ids, listings, images, SKUs, product_code; forces draft; suffixes name.
 */
export function buildProductCopySeed(source: ProductDetail): ProductCopySeed {
  const options = [...(source.options ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((o) => ({
      option_name: o.option_name,
      values: [...(o.values ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((v) => ({ option_value: v.option_value })),
    }));

  const variants = [...(source.variants ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((v) => ({
      sku: '',
      option_values: variantOptionValueTexts(v, source.options ?? []),
    }));

  return {
    product_name: copyProductName(source.product_name),
    product_code: '',
    description: source.description ?? '',
    brand: source.brand ?? '',
    category_id:
      source.category_id != null ? String(source.category_id) : '',
    status: 'draft',
    weight_kg: source.weight_kg != null ? String(source.weight_kg) : '',
    package_length_cm:
      source.package_length_cm != null
        ? String(source.package_length_cm)
        : '',
    package_width_cm:
      source.package_width_cm != null ? String(source.package_width_cm) : '',
    package_height_cm:
      source.package_height_cm != null
        ? String(source.package_height_cm)
        : '',
    options,
    variants,
  };
}
