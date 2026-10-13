'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ShopeeProductImportModal } from '@/components/catalog/ShopeeProductImportModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/finance/StatusBadge';
import { useTenant } from '@/components/layout/TenantProvider';
import {
  canImportShopeeProducts,
  canWriteProduct,
} from '@/lib/authHelpers';
import { productsApi } from '@/lib/services/productsApi';
import type {
  ListingSyncStatus,
  Product,
  ProductStatus,
} from '@/lib/types/product';
import {
  PRODUCT_STATUS_COLORS,
  PRODUCT_STATUS_LABELS,
  SYNC_STATUS_COLORS,
  SYNC_STATUS_LABELS,
} from '@/lib/utils/productLabels';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from '@/lib/utils/pagination';

export default function CatalogProductsPage() {
  const canWrite = canWriteProduct();
  const canImport = canImportShopeeProducts();
  const { ready: tenantReady } = useTenant();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [syncFilter, setSyncFilter] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    document.title = 'Products · Catalog · EcomHub';
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await productsApi.getList({
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        sync_status: syncFilter || undefined,
      });
      setProducts(response?.results ?? []);
      setTotalPages(response?.total_pages ?? 1);
      setTotalResults(response?.total_results ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, statusFilter, syncFilter]);

  useEffect(() => {
    if (!tenantReady) return;
    loadData();
  }, [tenantReady, loadData]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="EcomHub product master — create drafts, edit SKUs, import from Shopee, and push listings from product detail."
        actions={
          <>
            {canImport && (
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                Import from Shopee
              </Button>
            )}
            {canWrite && (
              <Link href="/catalog/products/new">
                <Button>New product</Button>
              </Link>
            )}
          </>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <Input
              label="Search"
              placeholder="Name, product code, or SKU"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setCurrentPage(DEFAULT_PAGE);
                  setSearchQuery(searchInput.trim());
                }
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
              value={statusFilter}
              onChange={(e) => {
                setCurrentPage(DEFAULT_PAGE);
                setStatusFilter(e.target.value);
              }}
            >
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Sync status
            </label>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
              value={syncFilter}
              onChange={(e) => {
                setCurrentPage(DEFAULT_PAGE);
                setSyncFilter(e.target.value);
              }}
            >
              <option value="">All</option>
              <option value="not_published">Not published</option>
              <option value="in_sync">In sync</option>
              <option value="pending_changes">Pending changes</option>
              <option value="push_failed">Push failed</option>
              <option value="conflict">Conflict</option>
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setCurrentPage(DEFAULT_PAGE);
              setSearchQuery(searchInput.trim());
            }}
          >
            Search
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-500">No products found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Sync</th>
                  <th className="px-3 py-2">Updated</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const st = (p.status || 'draft') as ProductStatus;
                  const syncFilterStatus = syncFilter
                    ? (syncFilter as ListingSyncStatus)
                    : null;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">
                        <Link
                          href={`/catalog/products/${p.id}`}
                          className="hover:underline"
                        >
                          {p.product_name}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {p.product_code || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          label={PRODUCT_STATUS_LABELS[st] || p.status}
                          colorClass={
                            PRODUCT_STATUS_COLORS[st] ||
                            'bg-gray-100 text-gray-800'
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        {syncFilterStatus ? (
                          <StatusBadge
                            label={
                              SYNC_STATUS_LABELS[syncFilterStatus] ||
                              syncFilter
                            }
                            colorClass={
                              SYNC_STATUS_COLORS[syncFilterStatus] ||
                              'bg-gray-100 text-gray-800'
                            }
                          />
                        ) : (
                          <span
                            className="text-gray-400"
                            title="Open detail for per-listing sync status"
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {p.updated_at
                          ? new Date(p.updated_at).toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-right space-x-3">
                        <Link
                          href={`/catalog/products/${p.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                        {canWrite && (
                          <Link
                            href={`/catalog/products/new?copy_from=${p.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            Copy
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
            pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setCurrentPage(DEFAULT_PAGE);
              setPageSize(size);
            }}
          />
        </div>
      </Card>

      {canImport && (
        <ShopeeProductImportModal
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
          onImported={loadData}
        />
      )}
    </div>
  );
}
