// Product catalog API (Core F8b / F8e)

import { api } from '../api';
import type { PaginatedResponse } from '../types';
import type {
  Product,
  ProductDetail,
  ProductForm,
  ProductImageDetail,
  ProductImageOrderForm,
  ProductListParams,
  ProductVariant,
  ProductVariantForm,
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
};
