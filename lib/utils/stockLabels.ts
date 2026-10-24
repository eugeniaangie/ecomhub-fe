import type { ManualMovementType, StockMovementType } from '../types/stock';
import { MANUAL_MOVEMENT_TYPES } from '../types/stock';

export function formatQuantity(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return String(value);
}

export function formatMovementType(type: string): string {
  return type.replace(/_/g, ' ');
}

export const MANUAL_MOVEMENT_TYPE_OPTIONS: {
  value: ManualMovementType;
  label: string;
}[] = MANUAL_MOVEMENT_TYPES.map((value) => ({
  value,
  label: formatMovementType(value),
}));

export function isManualMovementType(
  type: string
): type is ManualMovementType {
  return (MANUAL_MOVEMENT_TYPES as readonly string[]).includes(type);
}

/** Display-only — do not invent totals from these. */
export function movementTypeBadgeClass(type: StockMovementType | string): string {
  switch (type) {
    case 'opening_balance':
    case 'receipt':
    case 'transfer_in':
      return 'bg-green-50 text-green-800';
    case 'adjustment':
    case 'opname_adjustment':
      return 'bg-amber-50 text-amber-900';
    case 'reversal':
    case 'transfer_out':
      return 'bg-orange-50 text-orange-900';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
