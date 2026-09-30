// Marketplace integrations API (Shopee OAuth — Core F6a)

import { api } from '../api';

const API_VERSION = '/api/v1';

export interface ShopeeAuthorizeUrl {
  authorize_url: string;
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
};
