import { api } from '../api';
import type { PaginatedResponse } from '../types';
import type {
  CreateWarehouseForm,
  UpdateWarehouseForm,
  Warehouse,
  WarehouseListParams,
} from '../types/warehouse';

const API_VERSION = '/api/v1';

/** Core F9c / FE51 — tenant warehouses. */
export const warehousesApi = {
  list: async (params: WarehouseListParams) => {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });
    if (params.search?.trim()) {
      query.set('search', params.search.trim());
    }
    return api.get<PaginatedResponse<Warehouse>>(
      `${API_VERSION}/warehouses?${query.toString()}`
    );
  },

  listAll: async () => {
    return api.get<Warehouse[]>(`${API_VERSION}/warehouses/no_page`);
  },

  getById: async (id: number) => {
    return api.get<Warehouse>(`${API_VERSION}/warehouses/${id}`);
  },

  create: async (body: CreateWarehouseForm) => {
    return api.post<Warehouse>(`${API_VERSION}/warehouses`, body);
  },

  update: async (id: number, body: UpdateWarehouseForm) => {
    return api.put<Warehouse>(`${API_VERSION}/warehouses/${id}`, body);
  },
};
