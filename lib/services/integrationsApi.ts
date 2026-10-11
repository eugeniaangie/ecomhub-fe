// Marketplace integrations API (Shopee OAuth + F6b0 preview)

import { api } from '../api';

const API_VERSION = '/api/v1';

export interface ShopeeAuthorizeUrl {
  authorize_url: string;
}

export interface ShopeeConnectedShop {
  id: number;
  platform: string;
  shop_id: number;
  expire_in: number;
  token_expires_at: string;
  is_active: boolean;
}

export interface ShopeeSkuSummaryItem {
  sku: string;
  quantity: number;
  order_count: number;
}

export interface ShopeeMoneyLine {
  key: string;
  label: string;
  amount: number;
  sources?: string[];
}

export interface ShopeeOrderPreviewItem {
  order_sn: string;
  order_status?: string;
  total_amount?: number;
  escrow_amount?: number;
  commission_fee?: number;
  service_fee?: number;
  seller_transaction_fee?: number;
  create_time?: number;
  item_skus?: string[];
  cancel_reason?: string;
  /** Approx: pembatalan | pengembalian */
  cancel_bucket?: string;
}

export interface ShopeeOrdersPreview {
  shop_id: number;
  time_from: number;
  time_to: number;
  more: boolean;
  next_cursor?: string;
  exclude_cancelled: boolean;
  order_status?: string;
  cancel_bucket?: string;
  cancel_reason?: string;
  exclude_pembatalan?: boolean;
  fetch_all: boolean;
  token_refreshed: boolean;
  order_count: number;
  total_quantity: number;
  total_buyer_amount: number;
  total_escrow_amount: number;
  total_deductions?: number;
  deduction_breakdown?: ShopeeMoneyLine[];
  escrow_partial?: boolean;
  escrow_failed_order_sns?: string[];
  cancel_reason_options?: string[];
  sku_summary: ShopeeSkuSummaryItem[];
  orders: ShopeeOrderPreviewItem[];
}

export interface PreviewShopeeOrdersParams {
  shop_id?: number;
  time_from?: number;
  time_to?: number;
  page_size?: number;
  cursor?: string;
  exclude_cancelled?: boolean;
  order_status?: string;
  fetch_all?: boolean;
  cancel_bucket?: string;
  cancel_reason?: string;
  exclude_pembatalan?: boolean;
}

export interface ShopeeReturnItemLine {
  sku: string;
  name?: string;
  quantity: number;
  item_price?: number;
}

export interface ShopeeReturnPreviewItem {
  return_sn: string;
  order_sn?: string;
  status?: string;
  reason?: string;
  text_reason?: string;
  reassessed_request_reason?: string;
  refund_amount?: number;
  currency?: string;
  create_time?: number;
  update_time?: number;
  due_date?: number;
  return_seller_due_date?: number;
  needs_logistics?: boolean;
  /** 0 = return+refund, 1 = refund only */
  return_solution?: number;
  return_refund_type?: string;
  item_skus?: string[];
  items?: ShopeeReturnItemLine[];
  quantity: number;
}

export interface ShopeeReturnsPreview {
  shop_id: number;
  time_from: number;
  time_to: number;
  more: boolean;
  next_page_no?: number;
  fetch_all: boolean;
  return_status?: string;
  token_refreshed: boolean;
  return_count: number;
  total_quantity: number;
  total_refund_amount: number;
  sku_summary: ShopeeSkuSummaryItem[];
  returns: ShopeeReturnPreviewItem[];
}

export interface PreviewShopeeReturnsParams {
  shop_id?: number;
  time_from?: number;
  time_to?: number;
  page_size?: number;
  page_no?: number;
  fetch_all?: boolean;
  return_status?: string;
}

export interface ShopeeAdsSpendPreview {
  shop_id: number;
  time_from: number;
  time_to: number;
  start_date: string;
  end_date: string;
  token_refreshed: boolean;
  total_ads_spend: number;
  day_count: number;
  partner_calls: number;
  used_hourly_api: boolean;
}

export interface PreviewShopeeAdsSpendParams {
  shop_id?: number;
  time_from?: number;
  time_to?: number;
}

export interface ShopeeAdsPerformancePoint {
  date: string;
  hour?: number;
  impression: number;
  clicks: number;
  expense: number;
  direct_gmv: number;
  broad_gmv: number;
  direct_order: number;
  broad_order: number;
  direct_roas: number;
  broad_roas: number;
}

export interface ShopeeAdsPerformancePreview {
  shop_id: number;
  time_from: number;
  time_to: number;
  start_date: string;
  end_date: string;
  token_refreshed: boolean;
  day_count: number;
  partner_calls: number;
  used_hourly_api: boolean;
  series_grain: 'daily' | 'hourly' | string;
  total_ads_spend: number;
  impression: number;
  clicks: number;
  direct_gmv: number;
  broad_gmv: number;
  direct_order: number;
  broad_order: number;
  direct_roas: number;
  broad_roas: number;
  series: ShopeeAdsPerformancePoint[];
  ads_wallet_balance?: number | null;
  balance_as_of?: number | null;
  balance_error?: string;
}

export type PreviewShopeeAdsPerformanceParams = PreviewShopeeAdsSpendParams;

export interface ShopeeOrderDetailItemLine {
  sku: string;
  name?: string;
  quantity: number;
  original_price?: number;
  discounted_price?: number;
}

export interface ShopeeOrderDetail {
  shop_id: number;
  order_sn: string;
  order_status?: string;
  create_time?: number;
  cancel_reason?: string;
  token_refreshed: boolean;
  escrow_available: boolean;
  buyer_amount: number;
  original_price: number;
  selling_price: number;
  escrow_amount: number;
  deductions: ShopeeMoneyLine[];
  total_deductions: number;
  items: ShopeeOrderDetailItemLine[];
}

export interface GetShopeeOrderDetailParams {
  shop_id?: number;
  order_sn: string;
}

export interface ImportShopeeProductsParams {
  shop_id?: number;
  offset?: number;
  page_size?: number;
  /** Selective live-fetch import (F8l); max 100. Ignored when products is set. */
  item_ids?: number[];
  /**
   * Trusted commit from a prior preview (Core F8m). When set, Core skips Shopee re-fetch.
   * Pass the full normalized preview rows for the selected item_ids (≤100).
   */
  products?: ShopeeNormalizedProduct[];
}

export interface PreviewShopeeProductsParams {
  shop_id?: number;
  offset?: number;
  page_size?: number;
  item_ids?: number[];
  item_status?: string;
}

export type ShopeeProductImportStatus =
  | 'created'
  | 'updated'
  | 'skipped_kit'
  | 'failed';

export interface ShopeeProductImportItemResult {
  item_id: number;
  status: ShopeeProductImportStatus | string;
  product_id?: number | null;
  listing_id?: number | null;
  message?: string;
}

export interface ShopeeProductsImportResult {
  shop_id: number;
  total_count: number;
  has_next_page: boolean;
  next_offset: number;
  created: number;
  updated: number;
  skipped_kit: number;
  failed: number;
  items: ShopeeProductImportItemResult[];
  not_returned?: number[];
  token_refreshed: boolean;
}

/** One normalized Shopee item from products/preview (F8c / F8l). */
export interface ShopeeNormalizedProduct {
  item_id: number;
  item_status?: string;
  item_name?: string;
  item_sku?: string;
  is_kit?: boolean;
  skipped_kit?: boolean;
  is_imported?: boolean;
  product_id?: number | null;
  listing_id?: number | null;
  has_model?: boolean;
  brand_name?: string;
}

export interface ShopeeProductsPreviewResult {
  shop_id: number;
  total_count: number;
  has_next_page: boolean;
  next_offset: number;
  list_count: number;
  products: ShopeeNormalizedProduct[];
  not_returned?: number[];
  token_refreshed: boolean;
}

const MAX_ITEM_IDS = 100;

function appendShopAndPaging(
  query: URLSearchParams,
  params: {
    shop_id?: number;
    offset?: number;
    page_size?: number;
    item_ids?: number[];
  }
) {
  if (params.shop_id && params.shop_id > 0) {
    query.set('shop_id', String(params.shop_id));
  }
  if (params.item_ids && params.item_ids.length > 0) {
    query.set('item_ids', params.item_ids.join(','));
    return;
  }
  if (params.offset != null && params.offset >= 0) {
    query.set('offset', String(params.offset));
  }
  if (params.page_size && params.page_size > 0) {
    query.set('page_size', String(params.page_size));
  }
}

export const shopeeAuthApi = {
  /**
   * Signed Shopee auth_partner URL. Open in the browser to connect a shop.
   * Roles: superadmin, admin (Core F6a1).
   */
  getAuthorizeUrl: async () => {
    return api.get<ShopeeAuthorizeUrl>(
      `${API_VERSION}/integrations/marketplaces/shopee/authorize-url`
    );
  },

  /**
   * Exchange redirect code + shop_id for stored tokens (Core F6a3).
   * Response omits raw tokens.
   */
  exchangeToken: async (code: string, shopId: number) => {
    return api.post<ShopeeConnectedShop>(
      `${API_VERSION}/integrations/marketplaces/shopee/token`,
      { code, shop_id: shopId }
    );
  },

  /**
   * List connected Shopee shops (no raw tokens). Roles: admin+.
   */
  listConnectedShops: async () => {
    return api.get<ShopeeConnectedShop[]>(
      `${API_VERSION}/integrations/marketplaces/shopee/connections`
    );
  },

  /**
   * Live order preview (list → detail → escrow). Roles: admin+ (Core F6b0).
   */
  previewOrders: async (params: PreviewShopeeOrdersParams = {}) => {
    const query = new URLSearchParams();
    if (params.shop_id && params.shop_id > 0) {
      query.set('shop_id', String(params.shop_id));
    }
    if (params.time_from && params.time_from > 0) {
      query.set('time_from', String(params.time_from));
    }
    if (params.time_to && params.time_to > 0) {
      query.set('time_to', String(params.time_to));
    }
    if (params.page_size && params.page_size > 0) {
      query.set('page_size', String(params.page_size));
    }
    if (params.cursor) query.set('cursor', params.cursor);
    if (params.exclude_cancelled) query.set('exclude_cancelled', 'true');
    if (params.order_status) query.set('order_status', params.order_status);
    if (params.fetch_all) query.set('fetch_all', 'true');
    if (params.cancel_bucket) query.set('cancel_bucket', params.cancel_bucket);
    if (params.cancel_reason) query.set('cancel_reason', params.cancel_reason);
    if (params.exclude_pembatalan) query.set('exclude_pembatalan', 'true');

    const qs = query.toString();
    return api.get<ShopeeOrdersPreview>(
      `${API_VERSION}/integrations/marketplaces/shopee/orders/preview${qs ? `?${qs}` : ''}`
    );
  },

  /**
   * Live returns / pengembalian preview (get_return_list). Roles: admin+ (Core F6d).
   */
  previewReturns: async (params: PreviewShopeeReturnsParams = {}) => {
    const query = new URLSearchParams();
    if (params.shop_id && params.shop_id > 0) {
      query.set('shop_id', String(params.shop_id));
    }
    if (params.time_from && params.time_from > 0) {
      query.set('time_from', String(params.time_from));
    }
    if (params.time_to && params.time_to > 0) {
      query.set('time_to', String(params.time_to));
    }
    if (params.page_size && params.page_size > 0) {
      query.set('page_size', String(params.page_size));
    }
    if (params.page_no && params.page_no > 0) {
      query.set('page_no', String(params.page_no));
    }
    if (params.fetch_all) query.set('fetch_all', 'true');
    if (params.return_status) query.set('return_status', params.return_status);

    const qs = query.toString();
    return api.get<ShopeeReturnsPreview>(
      `${API_VERSION}/integrations/marketplaces/shopee/returns/preview${qs ? `?${qs}` : ''}`
    );
  },

  /**
   * Live Shopee Ads spend (CPC expense sum). Roles: admin+ (Core F6e).
   * Not wallet balance / not Marketing JE / not F1 automation.
   */
  previewAdsSpend: async (params: PreviewShopeeAdsSpendParams = {}) => {
    const query = new URLSearchParams();
    if (params.shop_id && params.shop_id > 0) {
      query.set('shop_id', String(params.shop_id));
    }
    if (params.time_from && params.time_from > 0) {
      query.set('time_from', String(params.time_from));
    }
    if (params.time_to && params.time_to > 0) {
      query.set('time_to', String(params.time_to));
    }

    const qs = query.toString();
    return api.get<ShopeeAdsSpendPreview>(
      `${API_VERSION}/integrations/marketplaces/shopee/ads/spend/preview${qs ? `?${qs}` : ''}`
    );
  },

  /**
   * Shop-level Ads performance (spend, ROAS, GMV, series + wallet balance). Roles: admin+ (Core F6f).
   */
  previewAdsPerformance: async (params: PreviewShopeeAdsPerformanceParams = {}) => {
    const query = new URLSearchParams();
    if (params.shop_id && params.shop_id > 0) {
      query.set('shop_id', String(params.shop_id));
    }
    if (params.time_from && params.time_from > 0) {
      query.set('time_from', String(params.time_from));
    }
    if (params.time_to && params.time_to > 0) {
      query.set('time_to', String(params.time_to));
    }

    const qs = query.toString();
    return api.get<ShopeeAdsPerformancePreview>(
      `${API_VERSION}/integrations/marketplaces/shopee/ads/performance/preview${qs ? `?${qs}` : ''}`
    );
  },

  /**
   * One-order money detail (order + escrow breakdown). Roles: admin+.
   */
  getOrderDetail: async (params: GetShopeeOrderDetailParams) => {
    const query = new URLSearchParams();
    query.set('order_sn', params.order_sn);
    if (params.shop_id && params.shop_id > 0) {
      query.set('shop_id', String(params.shop_id));
    }
    return api.get<ShopeeOrderDetail>(
      `${API_VERSION}/integrations/marketplaces/shopee/orders/detail?${query.toString()}`
    );
  },

  /**
   * Live Shopee product preview (F8c / F8l). No DB writes except reading is_imported.
   * List page mode, or selective via item_ids (≤100).
   */
  previewProducts: async (params: PreviewShopeeProductsParams = {}) => {
    const query = new URLSearchParams();
    appendShopAndPaging(query, params);
    if (params.item_status) query.set('item_status', params.item_status);
    const qs = query.toString();
    return api.get<ShopeeProductsPreviewResult>(
      `${API_VERSION}/integrations/marketplaces/shopee/products/preview${qs ? `?${qs}` : ''}`
    );
  },

  /**
   * Import Shopee items into the catalog (Core F8d / F8l / F8m). Roles: admin+.
   * Prefer `products` (commit from preview — no Shopee re-fetch). Else page mode or item_ids.
   */
  importProducts: async (params: ImportShopeeProductsParams = {}) => {
    if (params.products && params.products.length > MAX_ITEM_IDS) {
      throw new Error(`At most ${MAX_ITEM_IDS} products per import request`);
    }
    if (params.item_ids && params.item_ids.length > MAX_ITEM_IDS) {
      throw new Error(`At most ${MAX_ITEM_IDS} item_ids per import request`);
    }

    const body: {
      shop_id?: number;
      products?: ShopeeNormalizedProduct[];
    } = {};
    if (params.shop_id && params.shop_id > 0) {
      body.shop_id = params.shop_id;
    }

    if (params.products && params.products.length > 0) {
      body.products = params.products;
      const query = new URLSearchParams();
      if (params.shop_id && params.shop_id > 0) {
        query.set('shop_id', String(params.shop_id));
      }
      const qs = query.toString();
      return api.post<ShopeeProductsImportResult>(
        `${API_VERSION}/integrations/marketplaces/shopee/products/import${qs ? `?${qs}` : ''}`,
        body
      );
    }

    const query = new URLSearchParams();
    appendShopAndPaging(query, params);
    const qs = query.toString();
    return api.post<ShopeeProductsImportResult>(
      `${API_VERSION}/integrations/marketplaces/shopee/products/import${qs ? `?${qs}` : ''}`,
      body.shop_id ? body : {}
    );
  },
};
