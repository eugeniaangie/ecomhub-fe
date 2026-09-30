// Marketplace integrations API (Shopee OAuth — Core F6a)

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
};
