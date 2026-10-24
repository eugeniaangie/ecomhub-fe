/** Core F9c — warehouse (stock location). No hard delete. */

export interface Warehouse {
  id: number;
  tenant_id: number;
  code: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface CreateWarehouseForm {
  code: string;
  name: string;
  is_default?: boolean;
}

export interface UpdateWarehouseForm {
  code: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
}

export interface WarehouseListParams {
  page: number;
  limit: number;
  search?: string;
}
