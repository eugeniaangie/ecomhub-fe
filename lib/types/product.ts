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
  channel_media_id?: number | null;
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
  storage_provider: string;
  storage_key: string;
  content_type?: string | null;
  byte_size?: number | null;
  width?: number | null;
  height?: number | null;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelMedia {
  id: number;
  tenant_id: number;
  platform: string;
  ext_image_id: string;
  source_url?: string | null;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  tenant_id: number;
  product_id: number;
  media_asset_id?: number | null;
  channel_media_id?: number | null;
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
  channel_media?: ChannelMedia | null;
}

/** Shopee seller_stock entry — draft initial stock + stock command. */
export interface SellerStockEntry {
  location_id?: string;
  stock: number;
}

export interface ListingDataLogisticInfo {
  logistic_id: number;
  enabled?: boolean;
  is_free?: boolean;
  size_id?: number;
}

export interface ListingDataBrand {
  brand_id: number;
  original_brand_name?: string;
}

export interface ListingDataAttributeValue {
  value_id: number;
  original_value_name?: string;
}

export interface ListingDataAttribute {
  attribute_id: number;
  attribute_value_list: ListingDataAttributeValue[];
}

export type ListingDataSizeChartMode = 'none' | 'template' | 'image' | '';

export interface ListingDataSizeChart {
  mode: ListingDataSizeChartMode;
  size_chart_id?: number;
  media_asset_id?: number;
}

export interface ListingDataPreOrder {
  is_pre_order?: boolean;
  days_to_ship?: number;
}

/** Desired channel fields stored on channel_listings.listing_data (Core §15.18.4). */
export interface ListingData {
  schema_version?: number;
  logistic_info?: ListingDataLogisticInfo[];
  brand?: ListingDataBrand;
  attribute_list?: ListingDataAttribute[];
  size_chart?: ListingDataSizeChart;
  condition?: string;
  pre_order?: ListingDataPreOrder;
  item_dangerous?: number;
}

export interface ChannelListingVariant {
  id: number;
  tenant_id: number;
  channel_listing_id: number;
  product_variant_id: number;
  ext_variant_id?: string | null;
  ext_sku?: string | null;
  ext_status?: string | null;
  ext_price?: number | null;
  currency?: string | null;
  ext_stock?: number | null;
  listing_price?: number | null;
  initial_seller_stock?: SellerStockEntry[] | null;
  channel_data?: Record<string, unknown> | null;
  absent_since?: string | null;
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface ChannelListing {
  id: number;
  tenant_id: number;
  product_id: number;
  marketplace_account_id: number;
  ext_product_id?: string | null;
  ext_sku?: string | null;
  ext_status?: string | null;
  ext_category_id?: string | null;
  ext_updated_at?: string | null;
  has_variants: boolean;
  sync_status: ListingSyncStatus | string;
  channel_data?: Record<string, unknown> | null;
  listing_data?: ListingData | Record<string, unknown> | null;
  last_pushed_at?: string | null;
  last_push_error?: string | null;
  push_started_at?: string | null;
  last_synced_at?: string | null;
  /** F8o — set when listing no longer on Shopee; cleared when seen again */
  absent_since?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

/** Observed Shopee model with no local listing-variant match (channel_data.unmatched_models). */
export interface UnmatchedShopeeModel {
  model_id?: number | string;
  model_sku?: string;
  model_status?: string;
  original_price?: number;
  stock?: number;
  tier_index?: number[];
}

/** F8o — POST …/shopee/products/reconcile */
export interface ShopeeListingReconcileItem {
  listing_id: number;
  product_id: number;
  ext_product_id: string;
  outcome: string;
  ext_status?: string;
  message?: string;
}

export interface ShopeeListingsReconcileResult {
  shop_id: number;
  checked: number;
  present: number;
  marked_gone: number;
  skipped_error: number;
  failed: number;
  items: ShopeeListingReconcileItem[];
  token_refreshed: boolean;
}

export interface ShopeeRelinkSuggestion {
  listing_variant_id: number;
  product_variant_id: number;
  master_sku: string;
  ext_variant_id: string;
  model_sku: string;
  reason: string;
}

export interface ShopeeRelinkSuggestResult {
  listing_id: number;
  suggestions: ShopeeRelinkSuggestion[];
}

export interface ShopeeRelinkVariantLink {
  listing_variant_id: number;
  ext_variant_id: string;
}

export interface ShopeeRelinkVariantsResult {
  listing_id: number;
  relinked: number;
}

export interface ChannelListingDetail extends ChannelListing {
  variants: ChannelListingVariant[];
}

export interface ChannelListingVariantInput {
  product_variant_id: number;
  listing_price?: number | null;
  initial_seller_stock?: SellerStockEntry[] | null;
}

export interface ChannelListingDraftForm {
  marketplace_account_id: number;
  listing_data?: ListingData | Record<string, unknown>;
  variants?: ChannelListingVariantInput[];
}

export interface ShopeeListingPushForm {
  item_status?: 'UNLIST' | 'NORMAL';
  is_live_confirmed?: boolean;
  overwrite_conflict?: boolean;
}

export interface ShopeeListingVisibilityForm {
  is_live_confirmed?: boolean;
}

export interface ShopeeListingStockVariantInput {
  product_variant_id: number;
  expected_stock: number;
  seller_stock: SellerStockEntry[];
}

export interface ShopeeListingStockForm {
  is_live_confirmed?: boolean;
  variants: ShopeeListingStockVariantInput[];
}

export interface ShopeeProductPushResult {
  listing_id: number;
  action: string;
  status: string;
  is_dry_run: boolean;
  ext_product_id?: string | null;
  message?: string;
  request_preview?: Record<string, unknown> | null;
}

export interface ChannelCategoryMapping {
  id: number;
  tenant_id: number;
  category_id: number;
  platform: string;
  ext_category_id: string;
  ext_category_path?: string | null;
  created_at: string;
  updated_at: string;
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
