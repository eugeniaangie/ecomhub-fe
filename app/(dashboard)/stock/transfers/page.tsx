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
import type { StockTransferDetail } from '@/lib/types/stock';
import type { Warehouse } from '@/lib/types/warehouse';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination';
import { formatQuantity, todayYmd } from '@/lib/utils/stockLabels';

type LineDraft = { picked: PickedVariant | null; quantity: string };

export default function StockTransfersPage() {
  const canWrite = canWriteStock();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<StockTransferDetail[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [fromId, setFromId] = useState<number | ''>('');
  const [toId, setToId] = useState<number | ''>('');
  const [transferDate, setTransferDate] = useState(todayYmd());
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([
    { picked: null, quantity: '' },
  ]);

  const [detail, setDetail] = useState<StockTransferDetail | null>(null);
  const [reverseBusy, setReverseBusy] = useState(false);

  useEffect(() => {
    document.title = 'Stock transfers · EcomHub';
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const list = await warehousesApi.listAll();
        setWarehouses(Array.isArray(list) ? list : []);
      } catch {
        setWarehouses([]);
      }
    })();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await stockApi.listTransfers({
        page: currentPage,
        limit: pageSize,
      });
      setRows(data?.results ?? []);
      setTotalPages(data?.total_pages ?? 1);
      setTotalResults(data?.total_results ?? 0);
    } catch (err: unknown) {
      setRows([]);
      setTotalPages(1);
      setTotalResults(0);
      setError(err instanceof Error ? err.message : 'Failed to load transfers');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeWarehouses = warehouses.filter((w) => w.is_active);

  const openCreate = () => {
    setFormError('');
    setFromId('');
    setToId('');
    setTransferDate(todayYmd());
    setNotes('');
    setLines([{ picked: null, quantity: '' }]);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (fromId === '' || toId === '') {
      setFormError('From and to warehouses are required');
      return;
    }
    if (fromId === toId) {
      setFormError('From and to warehouses must differ');
      return;
    }
    if (!transferDate.trim()) {
      setFormError('Transfer date is required');
      return;
    }
    const built = [];
    for (const line of lines) {
      if (!line.picked) {
        setFormError('Each line needs a variant');
        return;
      }
      const quantity = Number(line.quantity);
      if (!Number.isFinite(quantity) || !(quantity > 0)) {
        setFormError('Each line quantity must be greater than 0');
        return;
      }
      built.push({
        product_variant_id: line.picked.product_variant_id,
        quantity,
      });
    }
    if (built.length === 0) {
      setFormError('Add at least one line');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      await stockApi.createTransfer({
        from_warehouse_id: fromId,
        to_warehouse_id: toId,
        transfer_date: transferDate.trim(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        lines: built,
      });
      setModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to create transfer'
      );
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (id: number) => {
    try {
      setError('');
      const data = await stockApi.getTransfer(id);
      setDetail(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load transfer');
    }
  };

  const handleReverse = async () => {
    if (!detail) return;
    if (
      !confirm(
        `Reverse transfer #${detail.id}? Core creates a new transfer with warehouses swapped.`
      )
    ) {
      return;
    }
    try {
      setReverseBusy(true);
      setError('');
      await stockApi.reverseTransfer(detail.id);
      setDetail(null);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reverse failed');
    } finally {
      setReverseBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transfers"
        actions={
          canWrite ? (
            <Button onClick={openCreate}>New transfer</Button>
          ) : undefined
        }
      />

      <Card>
        {error ? (
          <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {isLoading && rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No transfers found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-2 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 font-medium">From</th>
                  <th className="px-2 py-2 font-medium">To</th>
                  <th className="px-2 py-2 font-medium">Lines</th>
                  <th className="px-2 py-2 font-medium">Notes</th>
                  <th className="px-2 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.id} className="text-gray-900">
                    <td className="px-2 py-2 text-xs">
                      {String(row.transfer_date).slice(0, 10)}
                    </td>
                    <td className="px-2 py-2 text-xs">
                      {row.from_warehouse_code || row.from_warehouse_id}
                    </td>
                    <td className="px-2 py-2 text-xs">
                      {row.to_warehouse_code || row.to_warehouse_id}
                    </td>
                    <td className="px-2 py-2 text-xs">
                      {(row.legs ?? []).length / 2 || (row.legs ?? []).length}
                    </td>
                    <td className="max-w-xs truncate px-2 py-2 text-xs text-gray-600">
                      {row.notes || '—'}
                      {row.reverses_transfer_id
                        ? ` · reverses #${row.reverses_transfer_id}`
                        : ''}
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void openDetail(row.id)}
                      >
                        View
                      </Button>
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
        title="New transfer"
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
              Transfer
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                From warehouse
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                value={fromId === '' ? '' : String(fromId)}
                disabled={saving}
                onChange={(e) =>
                  setFromId(e.target.value === '' ? '' : Number(e.target.value))
                }
              >
                <option value="">Select…</option>
                {activeWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                To warehouse
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                value={toId === '' ? '' : String(toId)}
                disabled={saving}
                onChange={(e) =>
                  setToId(e.target.value === '' ? '' : Number(e.target.value))
                }
              >
                <option value="">Select…</option>
                {activeWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} — {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Input
            label="Transfer date"
            type="date"
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={saving}
          />

          <div className="space-y-3 border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-700">Lines</p>
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="space-y-2 rounded border border-gray-100 p-2"
              >
                <VariantSkuPicker
                  value={line.picked}
                  disabled={saving}
                  onChange={(picked) =>
                    setLines((prev) =>
                      prev.map((l, i) => (i === idx ? { ...l, picked } : l))
                    )
                  }
                />
                <Input
                  label="Quantity"
                  type="number"
                  step="any"
                  value={line.quantity}
                  disabled={saving}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l, i) =>
                        i === idx ? { ...l, quantity: e.target.value } : l
                      )
                    )
                  }
                />
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={saving}
              onClick={() =>
                setLines((prev) => [...prev, { picked: null, quantity: '' }])
              }
            >
              Add line
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `Transfer #${detail.id}` : 'Transfer'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetail(null)}>
              Close
            </Button>
            {canWrite && detail && !detail.reverses_transfer_id ? (
              <Button
                variant="secondary"
                disabled={reverseBusy}
                isLoading={reverseBusy}
                onClick={() => void handleReverse()}
              >
                Reverse
              </Button>
            ) : null}
          </>
        }
      >
        {detail ? (
          <div className="space-y-3 text-sm text-gray-900">
            <p>
              {String(detail.transfer_date).slice(0, 10)} ·{' '}
              {detail.from_warehouse_code} → {detail.to_warehouse_code}
            </p>
            {detail.notes ? (
              <p className="text-gray-600">{detail.notes}</p>
            ) : null}
            {detail.reverses_transfer_id ? (
              <p className="text-xs text-amber-800">
                Reverses transfer #{detail.reverses_transfer_id}
              </p>
            ) : null}
            <table className="min-w-full text-left text-xs">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="py-1 pr-2">Type</th>
                  <th className="py-1 pr-2">Variant</th>
                  <th className="py-1 pr-2">Warehouse</th>
                  <th className="py-1">Δ qty</th>
                </tr>
              </thead>
              <tbody>
                {(detail.legs ?? []).map((leg) => (
                  <tr key={leg.id} className="border-b border-gray-50">
                    <td className="py-1 pr-2">{leg.movement_type}</td>
                    <td className="py-1 pr-2 font-mono">
                      #{leg.product_variant_id}
                    </td>
                    <td className="py-1 pr-2">#{leg.warehouse_id}</td>
                    <td className="py-1">
                      {formatQuantity(leg.quantity_delta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
