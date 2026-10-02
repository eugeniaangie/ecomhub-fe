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
};
