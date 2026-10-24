/** Core F9d — stock balances, movements, transfers. Quantities are JSON numbers (helpers.Quantity). */

export type StockMovementType =
  | 'opening_balance'
  | 'receipt'
  | 'adjustment'
  | 'opname_adjustment'
  | 'reversal'
  | 'transfer_out'
  | 'transfer_in';

/** Manual POST /stock/movements types only. */
export const MANUAL_MOVEMENT_TYPES = [
  'opening_balance',
  'receipt',
  'adjustment',
  'reversal',
] as const;

export type ManualMovementType = (typeof MANUAL_MOVEMENT_TYPES)[number];

export interface StockBalanceRow {
  product_variant_id: number;
  warehouse_id: number;
  quantity: number;
  product_id: number;
  product_name: string;
  product_status: string;
  sku: string;
  warehouse_code: string;
  warehouse_name: string;
  /** Shopee listing stock snapshot sum — not on-hand. */
  channel_ext_stock?: number | null;
}

export interface StockMovement {
  id: number;
  tenant_id: number;
  product_variant_id: number;
  warehouse_id: number;
  movement_type: StockMovementType | string;
  movement_date: string;
  quantity_delta: number;
  notes?: string | null;
  stock_opname_id?: number | null;
  stock_transfer_id?: number | null;
  reverses_movement_id?: number | null;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface StockMovementRow extends StockMovement {
  sku: string;
  product_id: number;
  product_name: string;
  product_status: string;
  warehouse_code: string;
  warehouse_name: string;
}

export interface CreateStockMovementForm {
  movement_type: ManualMovementType;
  product_variant_id: number;
  warehouse_id: number;
  quantity_delta: number;
  movement_date?: string;
  notes?: string;
  reverses_movement_id?: number;
}

export interface StockTransfer {
  id: number;
  tenant_id: number;
  from_warehouse_id: number;
  to_warehouse_id: number;
  transfer_date: string;
  notes?: string | null;
  reverses_transfer_id?: number | null;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface StockTransferDetail extends StockTransfer {
  from_warehouse_code?: string;
  from_warehouse_name?: string;
  to_warehouse_code?: string;
  to_warehouse_name?: string;
  legs: StockMovement[];
}

export interface CreateStockTransferLineForm {
  product_variant_id: number;
  quantity: number;
}

export interface CreateStockTransferForm {
  from_warehouse_id: number;
  to_warehouse_id: number;
  transfer_date: string;
  notes?: string;
  lines: CreateStockTransferLineForm[];
}

export interface ReverseStockTransferForm {
  transfer_date?: string;
  notes?: string;
}

export interface StockBalanceListParams {
  page: number;
  limit: number;
  search?: string;
  warehouse_id?: number;
  product_id?: number;
  product_variant_id?: number;
  include_archived?: boolean;
}

export interface StockMovementListParams {
  page: number;
  limit: number;
  search?: string;
  warehouse_id?: number;
  product_variant_id?: number;
  movement_type?: string;
}

export interface StockTransferListParams {
  page: number;
  limit: number;
  search?: string;
  from_warehouse_id?: number;
  to_warehouse_id?: number;
}

/** Core F9e — physical count. Status draft | completed only. */
export type StockOpnameStatus = 'draft' | 'completed';

export interface StockOpname {
  id: number;
  tenant_id: number;
  warehouse_id: number;
  opname_date: string;
  status: StockOpnameStatus | string;
  notes?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface StockOpnameLine {
  id: number;
  tenant_id: number;
  stock_opname_id: number;
  product_variant_id: number;
  system_quantity: number;
  counted_quantity: number;
  created_at: string;
  updated_at: string;
  created_by?: number | null;
  updated_by?: number | null;
}

export interface StockOpnameLineRow extends StockOpnameLine {
  /** counted − system — from API, do not re-derive for posting. */
  difference: number;
  sku: string;
  product_id: number;
  product_name: string;
  product_status: string;
}

export interface StockOpnameDetail extends StockOpname {
  warehouse_code?: string;
  warehouse_name?: string;
  lines: StockOpnameLineRow[];
}

export interface CreateStockOpnameLineForm {
  product_variant_id: number;
  counted_quantity?: number;
}

export interface CreateStockOpnameForm {
  warehouse_id: number;
  opname_date: string;
  notes?: string;
  lines?: CreateStockOpnameLineForm[];
}

export interface ReplaceStockOpnameLineForm {
  product_variant_id: number;
  counted_quantity: number;
}

export interface ReplaceStockOpnameLinesForm {
  lines: ReplaceStockOpnameLineForm[];
}

export interface StockOpnameListParams {
  page: number;
  limit: number;
  search?: string;
  warehouse_id?: number;
  status?: StockOpnameStatus | string;
}
