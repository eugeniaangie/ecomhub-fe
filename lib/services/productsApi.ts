// Product catalog API (Core F8b / F8e / F8g listing actions)

import { api } from '../api';
import type { PaginatedResponse } from '../types';
import type {
  AddVariantFromUnmatchedForm,
  ChannelListingDetail,
  ChannelListingDraftForm,
  Product,
  ProductDetail,
  ProductForm,
  ProductImageDetail,
  ProductImageOrderForm,
  ProductListParams,
  ProductVariant,
  ProductVariantForm,
  ShopeeListingPushForm,
  ShopeeListingStockForm,
  ShopeeListingVisibilityForm,
  ShopeeProductPushResult,
  ShopeeRebindResult,
  ShopeeRebindSuggestResult,
  ShopeeRelinkSuggestResult,
  ShopeeRelinkVariantLink,
  ShopeeRelinkVariantsResult,
} from '../types/product';

const API_VERSION = '/api/v1';

export const productsApi = {
  getList: async (params: ProductListParams) => {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });
    if (params.search) query.set('search', params.search);
    if (params.category_id && params.category_id > 0) {
      query.set('category_id', String(params.category_id));
    }
    if (params.status) query.set('status', params.status);
    if (params.sku_source) query.set('sku_source', params.sku_source);
    if (params.sync_status) query.set('sync_status', params.sync_status);

    return api.get<PaginatedResponse<Product>>(
      `${API_VERSION}/products?${query.toString()}`
    );
  },

  getById: async (id: number) => {
    return api.get<ProductDetail>(`${API_VERSION}/products/${id}`);
  },

  create: async (data: ProductForm) => {
    return api.post<ProductDetail>(`${API_VERSION}/products`, data);
  },

  update: async (id: number, data: ProductForm) => {
    return api.put<ProductDetail>(`${API_VERSION}/products/${id}`, data);
  },

  updateVariant: async (
    productId: number,
    variantId: number,
    data: ProductVariantForm
  ) => {
    return api.put<ProductVariant>(
      `${API_VERSION}/products/${productId}/variants/${variantId}`,
      data
    );
  },

  uploadImage: async (productId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ProductImageDetail>(
      `${API_VERSION}/products/${productId}/images`,
      form
    );
  },

  reorderImages: async (productId: number, data: ProductImageOrderForm) => {
    return api.put<ProductImageDetail[]>(
      `${API_VERSION}/products/${productId}/images`,
      data
    );
  },

  /** F8p — soft-retire product (status=archived). Listings must be unlinked first. */
  archive: async (productId: number) => {
    return api.post<ProductDetail>(`${API_VERSION}/products/${productId}/archive`);
  },

  /** F8p — remove local listing (never Shopee delete_*). Rejects still-live listings. */
  unlinkListing: async (productId: number, listingId: number) => {
    return api.delete<{ message?: string }>(
      `${API_VERSION}/products/${productId}/listings/${listingId}`
    );
  },

  /** F8p — delete gallery image + GC orphaned storage object. */
  deleteImage: async (productId: number, imageId: number) => {
    return api.delete<{ message?: string }>(
      `${API_VERSION}/products/${productId}/images/${imageId}`
    );
  },

  /** PUT /products/:id/listings/shopee — save draft listing_data + variant prices/stock. */
  saveShopeeListingDraft: async (
    productId: number,
    data: ChannelListingDraftForm
  ) => {
    return api.put<ChannelListingDetail>(
      `${API_VERSION}/products/${productId}/listings/shopee`,
      data
    );
  },

  pushListing: async (
    productId: number,
    listingId: number,
    opts: { is_dry_run?: boolean; body?: ShopeeListingPushForm } = {}
  ) => {
    const query = new URLSearchParams();
    if (opts.is_dry_run) query.set('is_dry_run', 'true');
    const qs = query.toString();
    return api.post<ShopeeProductPushResult>(
      `${API_VERSION}/products/${productId}/listings/${listingId}/push${qs ? `?${qs}` : ''}`,
      opts.body ?? {}
    );
  },

  pullListing: async (productId: number, listingId: number) => {
    return api.post<ShopeeProductPushResult>(
      `${API_VERSION}/products/${productId}/listings/${listingId}/pull`
    );
  },

  publishListing: async (
    productId: number,
    listingId: number,
    body: ShopeeListingVisibilityForm = {}
  ) => {
    return api.post<ShopeeProductPushResult>(
      `${API_VERSION}/products/${productId}/listings/${listingId}/publish`,
      body
    );
  },

  unlistListing: async (
    productId: number,
    listingId: number,
    body: ShopeeListingVisibilityForm = {}
  ) => {
    return api.post<ShopeeProductPushResult>(
      `${API_VERSION}/products/${productId}/listings/${listingId}/unlist`,
      body
    );
  },

  updateListingStock: async (
    productId: number,
    listingId: number,
    body: ShopeeListingStockForm,
    opts: { is_dry_run?: boolean } = {}
  ) => {
    const query = new URLSearchParams();
    if (opts.is_dry_run) query.set('is_dry_run', 'true');
    const qs = query.toString();
    return api.post<ShopeeProductPushResult>(
      `${API_VERSION}/products/${productId}/listings/${listingId}/stock${qs ? `?${qs}` : ''}`,
      body
    );
  },

  /** F8o A3 — suggested absent listing-variant ↔ unmatched model pairs (not applied). */
  getRelinkSuggestions: async (productId: number, listingId: number) => {
    return api.get<ShopeeRelinkSuggestResult>(
      `${API_VERSION}/products/${productId}/listings/${listingId}/relink-suggestions`
    );
  },

  /** F8o A3 — operator-confirmed re-link of absent variants to Shopee model_ids. */
  relinkVariants: async (
    productId: number,
    listingId: number,
    links: ShopeeRelinkVariantLink[]
  ) => {
    return api.post<ShopeeRelinkVariantsResult>(
      `${API_VERSION}/products/${productId}/listings/${listingId}/relink-variants`,
      { links }
    );
  },

  /** F8r — candidate Shopee items (not imported) for listing re-bind. */
  getRebindSuggestions: async (productId: number, listingId: number) => {
    return api.get<ShopeeRebindSuggestResult>(
      `${API_VERSION}/products/${productId}/listings/${listingId}/rebind-suggestions`
    );
  },

  /** F8r — point gone/draft listing at a new Shopee item_id (same shop). */
  rebindListing: async (
    productId: number,
    listingId: number,
    extProductId: string
  ) => {
    return api.post<ShopeeRebindResult>(
      `${API_VERSION}/products/${productId}/listings/${listingId}/rebind`,
      { ext_product_id: extProductId }
    );
  },

  /** F8q — create master variant + link from unmatched Shopee model. */
  addVariantFromUnmatched: async (
    productId: number,
    listingId: number,
    body: AddVariantFromUnmatchedForm
  ) => {
    return api.post<ProductDetail>(
      `${API_VERSION}/products/${productId}/listings/${listingId}/variants/from-unmatched`,
      body
    );
  },
};
