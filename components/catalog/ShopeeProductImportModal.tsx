'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/finance/StatusBadge';
import {
  shopeeAuthApi,
  type ShopeeConnectedShop,
  type ShopeeNormalizedProduct,
  type ShopeeProductsImportResult,
} from '@/lib/services/integrationsApi';
import {
  IMPORT_STATUS_COLORS,
  IMPORT_STATUS_LABELS,
} from '@/lib/utils/productLabels';

const PREVIEW_PAGE_SIZE = 50;
const IMPORT_CHUNK = 100;

function isKitRow(p: ShopeeNormalizedProduct): boolean {
  return Boolean(p.is_kit || p.skipped_kit);
}

function isSelectable(p: ShopeeNormalizedProduct): boolean {
  return !isKitRow(p);
}

export interface ShopeeProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful import so the catalog list can refresh. */
  onImported?: () => void | Promise<void>;
}

export function ShopeeProductImportModal({
  isOpen,
  onClose,
  onImported,
}: ShopeeProductImportModalProps) {
  const [shops, setShops] = useState<ShopeeConnectedShop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopId, setShopId] = useState(0);

  const [previewRows, setPreviewRows] = useState<ShopeeNormalizedProduct[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewLoadingMore, setPreviewLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] =
    useState<ShopeeProductsImportResult | null>(null);
  const [importTotals, setImportTotals] = useState({
    created: 0,
    updated: 0,
    skipped_kit: 0,
    failed: 0,
  });

  const selectableIds = useMemo(
    () => previewRows.filter(isSelectable).map((p) => p.item_id),
    [previewRows]
  );

  const allSelectableSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selected.has(id));

  const resetPreview = useCallback(() => {
    setPreviewRows([]);
    setSelected(new Set());
    setHasNextPage(false);
    setNextOffset(0);
    setTotalCount(0);
    setImportResult(null);
    setImportTotals({ created: 0, updated: 0, skipped_kit: 0, failed: 0 });
  }, []);

  const loadShops = useCallback(async () => {
    setShopsLoading(true);
    setError('');
    resetPreview();
    try {
      const list = await shopeeAuthApi.listConnectedShops();
      const active = (Array.isArray(list) ? list : []).filter((s) => s.is_active);
      setShops(active);
      const first = active[0]?.shop_id ?? 0;
      setShopId(first);
      if (active.length === 0) {
        setError(
          'No connected Shopee shop. Connect one under Settings › Shopee Integration.'
        );
      }
      return first;
    } catch (err: unknown) {
      setShops([]);
      setShopId(0);
      setError(
        err instanceof Error ? err.message : 'Failed to load Shopee shops'
      );
      return 0;
    } finally {
      setShopsLoading(false);
    }
  }, [resetPreview]);

  const loadPreviewPage = useCallback(
    async (opts: { shop: number; offset: number; append: boolean }) => {
      if (opts.shop <= 0) return;
      if (opts.append) setPreviewLoadingMore(true);
      else setPreviewLoading(true);
      setError('');
      try {
        const result = await shopeeAuthApi.previewProducts({
          shop_id: opts.shop,
          offset: opts.offset,
          page_size: PREVIEW_PAGE_SIZE,
        });
        const rows = result.products ?? [];
        setPreviewRows((prev) => {
          if (!opts.append) return rows;
          const seen = new Set(prev.map((p) => p.item_id));
          const merged = [...prev];
          for (const row of rows) {
            if (!seen.has(row.item_id)) merged.push(row);
          }
          return merged;
        });
        setHasNextPage(Boolean(result.has_next_page));
        setNextOffset(result.next_offset ?? 0);
        setTotalCount(result.total_count ?? 0);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'Failed to load Shopee preview'
        );
        if (!opts.append) setPreviewRows([]);
      } finally {
        setPreviewLoading(false);
        setPreviewLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      const shop = await loadShops();
      if (cancelled || shop <= 0) return;
      await loadPreviewPage({ shop, offset: 0, append: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, loadShops, loadPreviewPage]);

  const onShopChange = async (nextShop: number) => {
    setShopId(nextShop);
    resetPreview();
    if (nextShop > 0) {
      await loadPreviewPage({ shop: nextShop, offset: 0, append: false });
    }
  };

  const toggleOne = (itemId: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(selectableIds));
  };

  const runImport = async () => {
    const ids = [...selected];
    if (ids.length === 0) {
      setError('Select at least one product to import.');
      return;
    }
    setImporting(true);
    setError('');
    setImportResult(null);
    let totals = { created: 0, updated: 0, skipped_kit: 0, failed: 0 };
    let last: ShopeeProductsImportResult | null = null;
    const allItems: ShopeeProductsImportResult['items'] = [];

    try {
      const byItemId = new Map(previewRows.map((row) => [row.item_id, row]));
      for (let i = 0; i < ids.length; i += IMPORT_CHUNK) {
        const chunk = ids.slice(i, i + IMPORT_CHUNK);
        const products = chunk
          .map((id) => byItemId.get(id))
          .filter((row): row is ShopeeNormalizedProduct => Boolean(row));
        if (products.length === 0) {
          setError('Selected products are no longer in the preview list. Refresh preview and try again.');
          return;
        }
        // F8m: commit preview rows so Core skips a second Shopee fetch.
        const result = await shopeeAuthApi.importProducts({
          shop_id: shopId > 0 ? shopId : undefined,
          products,
        });
        last = result;
        totals = {
          created: totals.created + (result.created ?? 0),
          updated: totals.updated + (result.updated ?? 0),
          skipped_kit: totals.skipped_kit + (result.skipped_kit ?? 0),
          failed: totals.failed + (result.failed ?? 0),
        };
        if (result.items?.length) allItems.push(...result.items);
      }

      if (last) {
        setImportResult({ ...last, items: allItems });
      }
      setImportTotals(totals);

      // Mark imported rows in the preview list from import outcomes.
      const byItem = new Map(allItems.map((it) => [it.item_id, it]));
      setPreviewRows((prev) =>
        prev.map((row) => {
          const outcome = byItem.get(row.item_id);
          if (!outcome) return row;
          if (
            outcome.status === 'created' ||
            outcome.status === 'updated'
          ) {
            return {
              ...row,
              is_imported: true,
              product_id: outcome.product_id ?? row.product_id,
              listing_id: outcome.listing_id ?? row.listing_id,
            };
          }
          return row;
        })
      );

      await onImported?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const busy = shopsLoading || previewLoading || importing;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !importing && onClose()}
      title="Import from Shopee"
      size="xl"
      footer={
        <>
          <Button
            variant="secondary"
            disabled={importing}
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            isLoading={importing}
            disabled={busy || selected.size === 0}
            onClick={runImport}
          >
            Import selected ({selected.size})
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Preview Shopee items, select what to import. Re-import refreshes
          listing snapshots only (not name, SKU, or images).
        </p>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Shop
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 disabled:bg-gray-100"
              value={shopId}
              onChange={(e) => onShopChange(Number(e.target.value))}
              disabled={shopsLoading || shops.length === 0 || importing}
            >
              {shopsLoading ? (
                <option value={0}>Loading…</option>
              ) : shops.length === 0 ? (
                <option value={0}>No connected shop</option>
              ) : (
                shops.map((s) => (
                  <option key={s.id} value={s.shop_id}>
                    Shop {s.shop_id}
                  </option>
                ))
              )}
            </select>
          </div>
          <p className="pb-2 text-xs text-gray-500">
            {totalCount > 0
              ? `Showing ${previewRows.length} of ~${totalCount}`
              : previewLoading
                ? 'Loading preview…'
                : null}
          </p>
        </div>

        {previewLoading && previewRows.length === 0 ? (
          <p className="text-sm text-gray-500">Loading Shopee products…</p>
        ) : previewRows.length === 0 ? (
          <p className="text-sm text-gray-500">No products in this preview page.</p>
        ) : (
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-900">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                checked={allSelectableSelected}
                disabled={selectableIds.length === 0 || importing}
                onChange={(e) => toggleSelectAll(e.target.checked)}
              />
              Select all ({selectableIds.length} importable
              {previewRows.length !== selectableIds.length
                ? `; ${previewRows.length - selectableIds.length} kit skipped`
                : ''}
              )
            </label>

            <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 w-10" />
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Item ID</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewRows.map((row) => {
                    const kit = isKitRow(row);
                    const checked = selected.has(row.item_id);
                    const canToggle = !kit && !importing;
                    return (
                      <tr
                        key={row.item_id}
                        className={
                          kit
                            ? 'cursor-not-allowed bg-gray-50 text-gray-500'
                            : canToggle
                              ? 'cursor-pointer hover:bg-blue-50/60'
                              : ''
                        }
                        onClick={() => {
                          if (!canToggle) return;
                          toggleOne(row.item_id, !checked);
                        }}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            className={`h-4 w-4 accent-blue-600 ${
                              kit || importing
                                ? 'cursor-not-allowed'
                                : 'cursor-pointer'
                            }`}
                            checked={checked}
                            disabled={kit || importing}
                            onChange={(e) =>
                              toggleOne(row.item_id, e.target.checked)
                            }
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select ${row.item_name || row.item_id}`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">
                            {row.item_name || '—'}
                          </div>
                          {row.item_sku ? (
                            <div className="text-xs text-gray-500">
                              SKU {row.item_sku}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-600">
                          {row.item_id}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {kit ? (
                              <StatusBadge
                                label="Kit — cannot import"
                                colorClass="bg-gray-100 text-gray-700"
                              />
                            ) : null}
                            {row.is_imported ? (
                              <StatusBadge
                                label="Imported"
                                colorClass="bg-blue-100 text-blue-800"
                              />
                            ) : !kit ? (
                              <StatusBadge
                                label="Not imported"
                                colorClass="bg-amber-50 text-amber-900"
                              />
                            ) : null}
                            {row.is_imported && row.product_id ? (
                              <Link
                                href={`/catalog/products/${row.product_id}`}
                                className="cursor-pointer text-xs text-blue-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                #{row.product_id}
                              </Link>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasNextPage && (
              <Button
                variant="secondary"
                size="sm"
                isLoading={previewLoadingMore}
                disabled={busy}
                onClick={() =>
                  loadPreviewPage({
                    shop: shopId,
                    offset: nextOffset,
                    append: true,
                  })
                }
              >
                Load more
              </Button>
            )}
          </div>
        )}

        {(importResult ||
          importTotals.created +
            importTotals.updated +
            importTotals.skipped_kit +
            importTotals.failed >
            0) && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <p className="font-medium text-gray-900">
              Summary — created {importTotals.created}, updated{' '}
              {importTotals.updated}, skipped kit {importTotals.skipped_kit},
              failed {importTotals.failed}
            </p>
            {importResult?.items?.length ? (
              <div className="mt-3 max-h-48 overflow-y-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-1 pr-2">Item</th>
                      <th className="py-1 pr-2">Status</th>
                      <th className="py-1 pr-2">Product</th>
                      <th className="py-1">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.items.map((item) => (
                      <tr
                        key={`${item.item_id}-${item.status}`}
                        className="border-t border-gray-200"
                      >
                        <td className="py-1 pr-2 font-mono text-gray-900">
                          {item.item_id}
                        </td>
                        <td className="py-1 pr-2">
                          <StatusBadge
                            label={
                              IMPORT_STATUS_LABELS[item.status] || item.status
                            }
                            colorClass={
                              IMPORT_STATUS_COLORS[item.status] ||
                              'bg-gray-100 text-gray-800'
                            }
                          />
                        </td>
                        <td className="py-1 pr-2 text-gray-900">
                          {item.product_id ? (
                            <Link
                              href={`/catalog/products/${item.product_id}`}
                              className="text-blue-600 hover:underline"
                            >
                              #{item.product_id}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-1 text-gray-800">
                          {item.message || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}
