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
}

export interface ShopeeOrdersPreview {
  shop_id: number;
  time_from: number;
  time_to: number;
  more: boolean;
  next_cursor?: string;
  exclude_cancelled: boolean;
  order_status?: string;
  fetch_all: boolean;
  token_refreshed: boolean;
  order_count: number;
  total_buyer_amount: number;
  total_escrow_amount: number;
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

    const qs = query.toString();
    return api.get<ShopeeOrdersPreview>(
      `${API_VERSION}/integrations/marketplaces/shopee/orders/preview${qs ? `?${qs}` : ''}`
    );
  },
};
