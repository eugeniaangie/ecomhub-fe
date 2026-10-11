// Product domain types — mirror ecomhub-core model/validation (F8b / F8d / F8e).

export type ProductStatus = 'draft' | 'active';

export type SKUSource =
  | 'adopted'
  | 'canonicalized'
  | 'generated'
  | 'sequence'
  | 'manual';

export type ListingSyncStatus =
  | 'not_published'
  | 'in_sync'
  | 'pending_changes'
  | 'push_failed'
  | 'conflict';

export interface Product {
  id: number;
  tenant_id: number;
  product_name: string;
  product_code?: string | null;
  description?: string | null;
  brand?: string | null;
  category_id?: number | null;
  status: ProductStatus | string;
  weight_kg?: number | null;
  package_length_cm?: number | null;
  package_width_cm?: number | null;
  package_height_cm?: number | null;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface ProductOptionValue {
  id: number;
  tenant_id: number;
  product_option_id: number;
  position: number;
  option_value: string;
  media_asset_id?: number | null;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface ProductOption {
  id: number;
  tenant_id: number;
  product_id: number;
  position: number;
  option_name: string;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface ProductOptionDetail extends ProductOption {
  values: ProductOptionValue[];
}

export interface ProductVariant {
  id: number;
  tenant_id: number;
  product_id: number;
  sku: string;
  sku_source: SKUSource | string;
  position: number;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface ProductVariantOptionValue {
  product_variant_id: number;
  product_option_id: number;
  product_option_value_id: number;
}

export interface ProductVariantDetail extends ProductVariant {
  option_values: ProductVariantOptionValue[];
}

export interface MediaAsset {
  id: number;
  tenant_id: number;
  origin: string;
  status: string;
  storage_provider?: string | null;
  storage_key?: string | null;
  source_url?: string | null;
  external_image_id?: string | null;
  content_type?: string | null;
  byte_size?: number | null;
  width?: number | null;
  height?: number | null;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  tenant_id: number;
  product_id: number;
  media_asset_id: number;
  position: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface ProductImageDetail extends ProductImage {
  image_url?: string;
  media?: MediaAsset | null;
}

export interface ChannelListingVariant {
  id: number;
  tenant_id: number;
  channel_listing_id: number;
  product_variant_id: number;
  external_variant_id?: string | null;
  external_sku?: string | null;
  external_status?: string | null;
  external_price?: number | null;
  currency?: string | null;
  external_stock?: number | null;
  listing_price?: number | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelListing {
  id: number;
  tenant_id: number;
  product_id: number;
  marketplace_account_id: number;
  external_product_id?: string | null;
  external_sku?: string | null;
  external_status?: string | null;
  external_category_id?: string | null;
  external_updated_at?: string | null;
  has_variants: boolean;
  sync_status: ListingSyncStatus | string;
  last_pushed_at?: string | null;
  last_push_error?: string | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelListingDetail extends ChannelListing {
  variants: ChannelListingVariant[];
}

export interface ProductDetail extends Product {
  options: ProductOptionDetail[];
  variants: ProductVariantDetail[];
  images: ProductImageDetail[];
  listings: ChannelListingDetail[];
}

/** POST /products and PUT /products/:id body. */
export interface ProductForm {
  product_name: string;
  product_code?: string | null;
  description?: string | null;
  brand?: string | null;
  category_id?: number | null;
  status?: ProductStatus | string;
  weight_kg?: number | null;
  package_length_cm?: number | null;
  package_width_cm?: number | null;
  package_height_cm?: number | null;
  options?: ProductOptionInput[];
  variants?: ProductVariantInput[];
}

export interface ProductOptionInput {
  id?: number;
  option_name: string;
  values?: ProductOptionValueInput[];
}

export interface ProductOptionValueInput {
  id?: number;
  option_value: string;
  media_asset_id?: number | null;
}

export interface ProductVariantInput {
  sku?: string | null;
  option_values?: string[];
}

export interface ProductVariantForm {
  sku: string;
  position?: number;
}

export interface ProductImageOrderForm {
  image_ids: number[];
  primary_image_id: number;
}

export interface ProductListParams {
  page: number;
  limit: number;
  search?: string;
  category_id?: number;
  status?: string;
  sku_source?: string;
  sync_status?: string;
}
