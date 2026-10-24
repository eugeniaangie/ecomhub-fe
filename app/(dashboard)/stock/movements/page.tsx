'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  VariantSkuPicker,
  type PickedVariant,
} from '@/components/stock/VariantSkuPicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { canWriteStock } from '@/lib/authHelpers';
import { stockApi } from '@/lib/services/stockApi';
import { warehousesApi } from '@/lib/services/warehousesApi';
import type {
  ManualMovementType,
  StockMovementRow,
} from '@/lib/types/stock';
import type { Warehouse } from '@/lib/types/warehouse';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination';
import {
  formatMovementType,
  formatQuantity,
  MANUAL_MOVEMENT_TYPE_OPTIONS,
  movementTypeBadgeClass,
  todayYmd,
} from '@/lib/utils/stockLabels';

export default function StockMovementsPage() {
  const canWrite = canWriteStock();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<StockMovementRow[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [typeFilter, setTypeFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [movementType, setMovementType] =
    useState<ManualMovementType>('receipt');
  const [picked, setPicked] = useState<PickedVariant | null>(null);
  const [formWarehouseId, setFormWarehouseId] = useState<number | ''>('');
  const [qty, setQty] = useState('');
  const [movementDate, setMovementDate] = useState(todayYmd());
  const [notes, setNotes] = useState('');
  const [reversesId, setReversesId] = useState('');

  useEffect(() => {
    document.title = 'Stock movements · EcomHub';
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const list = await warehousesApi.listAll();
        const active = (Array.isArray(list) ? list : []).filter((w) => w.is_active);
        setWarehouses(Array.isArray(list) ? list : []);
        const def = active.find((w) => w.is_default) ?? active[0];
        if (def) setFormWarehouseId(def.id);
      } catch {
        setWarehouses([]);
      }
    })();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await stockApi.listMovements({
        page: currentPage,
        limit: pageSize,
        search: search || undefined,
        warehouse_id: warehouseId === '' ? undefined : warehouseId,
        movement_type: typeFilter || undefined,
      });
      setRows(data?.results ?? []);
      setTotalPages(data?.total_pages ?? 1);
      setTotalResults(data?.total_results ?? 0);
    } catch (err: unknown) {
      setRows([]);
      setTotalPages(1);
      setTotalResults(0);
      setError(err instanceof Error ? err.message : 'Failed to load movements');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search, warehouseId, typeFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setFormError('');
    setMovementType('receipt');
    setPicked(null);
    setQty('');
    setMovementDate(todayYmd());
    setNotes('');
    setReversesId('');
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!picked) {
      setFormError('Select a product variant');
      return;
    }
    if (formWarehouseId === '') {
      setFormError('Warehouse is required');
      return;
    }
    const quantity_delta = Number(qty);
    if (!Number.isFinite(quantity_delta)) {
      setFormError('Quantity must be a number');
      return;
    }
    if (
      (movementType === 'opening_balance' || movementType === 'receipt') &&
      !(quantity_delta > 0)
    ) {
      setFormError('Quantity must be greater than 0');
      return;
    }
    if (movementType === 'adjustment' && quantity_delta === 0) {
      setFormError('Quantity must not be zero');
      return;
    }
    if (movementType === 'adjustment' && !notes.trim()) {
      setFormError('Notes are required for adjustment');
      return;
    }
    let reverses_movement_id: number | undefined;
    if (movementType === 'reversal') {
      const id = Number(reversesId);
      if (!Number.isInteger(id) || id <= 0) {
        setFormError('reverses_movement_id is required');
        return;
      }
      reverses_movement_id = id;
    }

    try {
      setSaving(true);
      setFormError('');
      await stockApi.createMovement({
        movement_type: movementType,
        product_variant_id: picked.product_variant_id,
        warehouse_id: formWarehouseId,
        quantity_delta,
        ...(movementDate.trim() ? { movement_date: movementDate.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(reverses_movement_id != null ? { reverses_movement_id } : {}),
      });
      setModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to create movement'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movements"
        actions={
          canWrite ? (
            <Button onClick={openCreate}>Add movement</Button>
          ) : undefined
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <Input
              label="Search SKU"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setCurrentPage(DEFAULT_PAGE);
                  setSearch(searchInput.trim());
                }
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Warehouse
            </label>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              value={warehouseId === '' ? '' : String(warehouseId)}
              onChange={(e) => {
                setWarehouseId(
                  e.target.value === '' ? '' : Number(e.target.value)
                );
                setCurrentPage(DEFAULT_PAGE);
              }}
            >
              <option value="">All</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} — {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(DEFAULT_PAGE);
              }}
            >
              <option value="">All</option>
              {[
                ...MANUAL_MOVEMENT_TYPE_OPTIONS,
                { value: 'transfer_out', label: 'transfer out' },
                { value: 'transfer_in', label: 'transfer in' },
                { value: 'opname_adjustment', label: 'opname adjustment' },
              ].map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setCurrentPage(DEFAULT_PAGE);
              setSearch(searchInput.trim());
            }}
          >
            Search
          </Button>
        </div>

        {error ? (
          <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {isLoading && rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No movements found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-2 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 font-medium">Type</th>
                  <th className="px-2 py-2 font-medium">SKU</th>
                  <th className="px-2 py-2 font-medium">Warehouse</th>
                  <th className="px-2 py-2 font-medium">Δ qty</th>
                  <th className="px-2 py-2 font-medium">Notes</th>
                  <th className="px-2 py-2 font-medium">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.id} className="text-gray-900">
                    <td className="px-2 py-2 text-xs text-gray-600">
                      {row.movement_date?.slice?.(0, 10) ?? row.movement_date}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${movementTypeBadgeClass(row.movement_type)}`}
                      >
                        {formatMovementType(row.movement_type)}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-mono text-xs">{row.sku}</td>
                    <td className="px-2 py-2 text-xs">
                      {row.warehouse_code}
                    </td>
                    <td className="px-2 py-2 font-medium">
                      {formatQuantity(row.quantity_delta)}
                    </td>
                    <td className="max-w-xs truncate px-2 py-2 text-xs text-gray-600">
                      {row.notes || '—'}
                    </td>
                    <td className="px-2 py-2 font-mono text-xs text-gray-400">
                      #{row.id}
                      {row.reverses_movement_id
                        ? ` → #${row.reverses_movement_id}`
                        : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={totalResults}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(DEFAULT_PAGE);
            }}
          />
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        title="Add movement"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={saving}
              isLoading={saving}
              onClick={() => void handleSubmit()}
            >
              Post
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          {formError ? (
            <p className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
              {formError}
            </p>
          ) : null}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              value={movementType}
              disabled={saving}
              onChange={(e) =>
                setMovementType(e.target.value as ManualMovementType)
              }
            >
              {MANUAL_MOVEMENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <VariantSkuPicker
            value={picked}
            onChange={setPicked}
            disabled={saving}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Warehouse
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              value={formWarehouseId === '' ? '' : String(formWarehouseId)}
              disabled={saving}
              onChange={(e) =>
                setFormWarehouseId(
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
            >
              <option value="">Select…</option>
              {warehouses
                .filter((w) => w.is_active)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </option>
                ))}
            </select>
          </div>
          <Input
            label="Quantity delta"
            type="number"
            step="any"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Movement date"
            type="date"
            value={movementDate}
            onChange={(e) => setMovementDate(e.target.value)}
            disabled={saving}
          />
          {movementType === 'reversal' ? (
            <Input
              label="Reverses movement ID"
              type="number"
              value={reversesId}
              onChange={(e) => setReversesId(e.target.value)}
              disabled={saving}
            />
          ) : null}
          <Input
            label={
              movementType === 'adjustment' ? 'Notes (required)' : 'Notes'
            }
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={saving}
          />
        </div>
      </Modal>
    </div>
  );
}
