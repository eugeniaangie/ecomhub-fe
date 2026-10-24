'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { stockApi } from '@/lib/services/stockApi';
import { warehousesApi } from '@/lib/services/warehousesApi';
import type { StockBalanceRow } from '@/lib/types/stock';
import type { Warehouse } from '@/lib/types/warehouse';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination';
import { formatQuantity } from '@/lib/utils/stockLabels';

export default function StockBalancesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<StockBalanceRow[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [includeArchived, setIncludeArchived] = useState(false);

  useEffect(() => {
    document.title = 'Stock balances · EcomHub';
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
      const data = await stockApi.listBalances({
        page: currentPage,
        limit: pageSize,
        search: search || undefined,
        warehouse_id: warehouseId === '' ? undefined : warehouseId,
        include_archived: includeArchived,
      });
      setRows(data?.results ?? []);
      setTotalPages(data?.total_pages ?? 1);
      setTotalResults(data?.total_results ?? 0);
    } catch (err: unknown) {
      setRows([]);
      setTotalPages(1);
      setTotalResults(0);
      setError(err instanceof Error ? err.message : 'Failed to load balances');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search, warehouseId, includeArchived]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const applyFilters = () => {
    setCurrentPage(DEFAULT_PAGE);
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Balances" />

      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <Input
              label="Search SKU"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters();
              }}
              placeholder="SKU"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Warehouse
            </label>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              value={warehouseId === '' ? '' : String(warehouseId)}
              onChange={(e) => {
                const v = e.target.value;
                setWarehouseId(v === '' ? '' : Number(v));
                setCurrentPage(DEFAULT_PAGE);
              }}
            >
              <option value="">All</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} — {w.name}
                  {!w.is_active ? ' (inactive)' : ''}
                </option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => {
                setIncludeArchived(e.target.checked);
                setCurrentPage(DEFAULT_PAGE);
              }}
            />
            Include archived (zero qty)
          </label>
          <Button variant="secondary" onClick={applyFilters}>
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
            No balances found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-2 py-2 font-medium">SKU</th>
                  <th className="px-2 py-2 font-medium">Product</th>
                  <th className="px-2 py-2 font-medium">Warehouse</th>
                  <th className="px-2 py-2 font-medium">On-hand</th>
                  <th className="px-2 py-2 font-medium">Channel stock</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr
                    key={`${row.product_variant_id}-${row.warehouse_id}`}
                    className="text-gray-900"
                  >
                    <td className="px-2 py-2 font-mono text-xs">{row.sku}</td>
                    <td className="px-2 py-2">{row.product_name}</td>
                    <td className="px-2 py-2">
                      <span className="font-mono text-xs">{row.warehouse_code}</span>
                      <span className="text-gray-500"> · {row.warehouse_name}</span>
                    </td>
                    <td className="px-2 py-2 font-medium">
                      {formatQuantity(row.quantity)}
                    </td>
                    <td className="px-2 py-2 text-gray-600">
                      {row.channel_ext_stock == null
                        ? '—'
                        : formatQuantity(row.channel_ext_stock)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-500">
                      {row.product_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-2 text-xs text-gray-500">
          Channel stock is a Shopee listing snapshot, not EcomHub on-hand.
        </p>

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
    </div>
  );
}
