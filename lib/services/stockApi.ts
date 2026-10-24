import { api } from '../api';
import type { PaginatedResponse } from '../types';
import type {
  CreateStockMovementForm,
  CreateStockOpnameForm,
  CreateStockTransferForm,
  ReplaceStockOpnameLinesForm,
  ReverseStockTransferForm,
  StockBalanceListParams,
  StockBalanceRow,
  StockMovement,
  StockMovementListParams,
  StockMovementRow,
  StockOpnameDetail,
  StockOpnameListParams,
  StockTransferDetail,
  StockTransferListParams,
} from '../types/stock';

const API_VERSION = '/api/v1';

function optionalId(query: URLSearchParams, key: string, value?: number) {
  if (value != null && value > 0) query.set(key, String(value));
}

/** Core F9d / FE52 — balances, movements, transfers. */
export const stockApi = {
  listBalances: async (params: StockBalanceListParams) => {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });
    if (params.search?.trim()) query.set('search', params.search.trim());
    optionalId(query, 'warehouse_id', params.warehouse_id);
    optionalId(query, 'product_id', params.product_id);
    optionalId(query, 'product_variant_id', params.product_variant_id);
    if (params.include_archived) query.set('include_archived', 'true');
    return api.get<PaginatedResponse<StockBalanceRow>>(
      `${API_VERSION}/stock/balances?${query.toString()}`
    );
  },

  listMovements: async (params: StockMovementListParams) => {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });
    if (params.search?.trim()) query.set('search', params.search.trim());
    optionalId(query, 'warehouse_id', params.warehouse_id);
    optionalId(query, 'product_variant_id', params.product_variant_id);
    if (params.movement_type?.trim()) {
      query.set('movement_type', params.movement_type.trim());
    }
    return api.get<PaginatedResponse<StockMovementRow>>(
      `${API_VERSION}/stock/movements?${query.toString()}`
    );
  },

  createMovement: async (body: CreateStockMovementForm) => {
    return api.post<StockMovement>(`${API_VERSION}/stock/movements`, body);
  },

  listTransfers: async (params: StockTransferListParams) => {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });
    if (params.search?.trim()) query.set('search', params.search.trim());
    optionalId(query, 'from_warehouse_id', params.from_warehouse_id);
    optionalId(query, 'to_warehouse_id', params.to_warehouse_id);
    return api.get<PaginatedResponse<StockTransferDetail>>(
      `${API_VERSION}/stock/transfers?${query.toString()}`
    );
  },

  getTransfer: async (id: number) => {
    return api.get<StockTransferDetail>(`${API_VERSION}/stock/transfers/${id}`);
  },

  createTransfer: async (body: CreateStockTransferForm) => {
    return api.post<StockTransferDetail>(`${API_VERSION}/stock/transfers`, body);
  },

  reverseTransfer: async (id: number, body?: ReverseStockTransferForm) => {
    return api.post<StockTransferDetail>(
      `${API_VERSION}/stock/transfers/${id}/reverse`,
      body ?? {}
    );
  },

  /** F9e — physical counts */
  listOpnames: async (params: StockOpnameListParams) => {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });
    if (params.search?.trim()) query.set('search', params.search.trim());
    optionalId(query, 'warehouse_id', params.warehouse_id);
    if (params.status?.trim()) query.set('status', params.status.trim());
    return api.get<PaginatedResponse<StockOpnameDetail>>(
      `${API_VERSION}/stock/opnames?${query.toString()}`
    );
  },

  getOpname: async (id: number) => {
    return api.get<StockOpnameDetail>(`${API_VERSION}/stock/opnames/${id}`);
  },

  createOpname: async (body: CreateStockOpnameForm) => {
    return api.post<StockOpnameDetail>(`${API_VERSION}/stock/opnames`, body);
  },

  replaceOpnameLines: async (id: number, body: ReplaceStockOpnameLinesForm) => {
    return api.put<StockOpnameDetail>(
      `${API_VERSION}/stock/opnames/${id}/lines`,
      body
    );
  },

  refreshOpnameSystem: async (id: number) => {
    return api.post<StockOpnameDetail>(
      `${API_VERSION}/stock/opnames/${id}/refresh-system`,
      {}
    );
  },

  completeOpname: async (id: number) => {
    return api.post<StockOpnameDetail>(
      `${API_VERSION}/stock/opnames/${id}/complete`,
      {}
    );
  },
};
