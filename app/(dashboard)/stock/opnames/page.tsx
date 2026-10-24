'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { canWriteStock } from '@/lib/authHelpers';
import { stockApi } from '@/lib/services/stockApi';
import { warehousesApi } from '@/lib/services/warehousesApi';
import type { StockOpnameDetail } from '@/lib/types/stock';
import type { Warehouse } from '@/lib/types/warehouse';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination';
import { todayYmd } from '@/lib/utils/stockLabels';

export default function StockOpnamesPage() {
  const router = useRouter();
  const canWrite = canWriteStock();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<StockOpnameDetail[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [status, setStatus] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formWarehouseId, setFormWarehouseId] = useState<number | ''>('');
  const [opnameDate, setOpnameDate] = useState(todayYmd());
  const [notes, setNotes] = useState('');
  const [seedFromBalances, setSeedFromBalances] = useState(true);

  useEffect(() => {
    document.title = 'Stock opname · EcomHub';
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const list = await warehousesApi.listAll();
        const all = Array.isArray(list) ? list : [];
        setWarehouses(all);
        const def =
          all.find((w) => w.is_active && w.is_default) ??
          all.find((w) => w.is_active);
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
      const data = await stockApi.listOpnames({
        page: currentPage,
        limit: pageSize,
        warehouse_id: warehouseId === '' ? undefined : warehouseId,
        status: status || undefined,
      });
      setRows(data?.results ?? []);
      setTotalPages(data?.total_pages ?? 1);
      setTotalResults(data?.total_results ?? 0);
    } catch (err: unknown) {
      setRows([]);
      setTotalPages(1);
      setTotalResults(0);
      setError(err instanceof Error ? err.message : 'Failed to load opnames');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, warehouseId, status]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (formWarehouseId === '') {
      setFormError('Warehouse is required');
      return;
    }
    if (!opnameDate.trim()) {
      setFormError('Opname date is required');
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      let lines:
        | { product_variant_id: number; counted_quantity?: number }[]
        | undefined;
      if (seedFromBalances) {
        const bal = await stockApi.listBalances({
          page: 1,
          limit: 100,
          warehouse_id: formWarehouseId,
        });
        const results = bal?.results ?? [];
        if (results.length === 0) {
          setFormError(
            'No balances in this warehouse to seed. Uncheck seed, or add stock first.'
          );
          return;
        }
        // Omit counted_quantity → Core uses system snapshot.
        lines = results.map((r) => ({
          product_variant_id: r.product_variant_id,
        }));
        // Paginate if more than one page
        const totalPagesBal = bal?.total_pages ?? 1;
        for (let p = 2; p <= totalPagesBal; p++) {
          const more = await stockApi.listBalances({
            page: p,
            limit: 100,
            warehouse_id: formWarehouseId,
          });
          for (const r of more?.results ?? []) {
            lines.push({ product_variant_id: r.product_variant_id });
          }
        }
      }

      const created = await stockApi.createOpname({
        warehouse_id: formWarehouseId,
        opname_date: opnameDate.trim(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(lines ? { lines } : {}),
      });
      setModalOpen(false);
      router.push(`/stock/opnames/${created.id}`);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Failed to create opname'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opname"
        actions={
          canWrite ? (
            <Button
              onClick={() => {
                setFormError('');
                setOpnameDate(todayYmd());
                setNotes('');
                setSeedFromBalances(true);
                setModalOpen(true);
              }}
            >
              New opname
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
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
              Status
            </label>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setCurrentPage(DEFAULT_PAGE);
              }}
            >
              <option value="">All</option>
              <option value="draft">draft</option>
              <option value="completed">completed</option>
            </select>
          </div>
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
            No opnames found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-2 py-2 font-medium">Date</th>
                  <th className="px-2 py-2 font-medium">Warehouse</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Lines</th>
                  <th className="px-2 py-2 font-medium">Notes</th>
                  <th className="px-2 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.id} className="text-gray-900">
                    <td className="px-2 py-2 text-xs">
                      {String(row.opname_date).slice(0, 10)}
                    </td>
                    <td className="px-2 py-2 text-xs">
                      {row.warehouse_code || `#${row.warehouse_id}`}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${
                          row.status === 'completed'
                            ? 'bg-green-50 text-green-800'
                            : 'bg-amber-50 text-amber-900'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs">
                      {(row.lines ?? []).length}
                    </td>
                    <td className="max-w-xs truncate px-2 py-2 text-xs text-gray-600">
                      {row.notes || '—'}
                    </td>
                    <td className="px-2 py-2">
                      <Link
                        href={`/stock/opnames/${row.id}`}
                        className="text-sm font-medium text-sky-700 hover:underline"
                      >
                        Open
                      </Link>
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
        title="New opname"
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
              onClick={() => void handleCreate()}
            >
              Create draft
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
            label="Opname date"
            type="date"
            value={opnameDate}
            onChange={(e) => setOpnameDate(e.target.value)}
            disabled={saving}
          />
          <Input
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={saving}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={seedFromBalances}
              disabled={saving}
              onChange={(e) => setSeedFromBalances(e.target.checked)}
            />
            Seed lines from current warehouse balances
          </label>
        </div>
      </Modal>
    </div>
  );
}
