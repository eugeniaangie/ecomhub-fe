'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { canConnectShopeeShop } from '@/lib/authHelpers';
import {
  shopeeAuthApi,
  type ShopeeConnectedShop,
  type ShopeeOrdersPreview,
} from '@/lib/services/integrationsApi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  formatCurrency,
  formatDateForAPI,
  getFirstDayOfCurrentMonth,
  getTodayFormatted,
} from '@/lib/utils/formatters';

const MAX_RANGE_DAYS = 31;

/** Cancel bucket only when drilling into CANCELLED. */
function showCancelBucketFilter(orderStatus: string): boolean {
  return orderStatus === 'CANCELLED';
}

/** Exclude-pembatalan checkbox only on All statuses. */
function showExcludePembatalan(orderStatus: string): boolean {
  return orderStatus === '';
}

function startOfDayUnix(ymd: string): number {
  return Math.floor(new Date(`${ymd}T00:00:00`).getTime() / 1000);
}

function endOfDayUnix(ymd: string): number {
  return Math.floor(new Date(`${ymd}T23:59:59`).getTime() / 1000);
}

function daySpanInclusive(startYmd: string, endYmd: string): number {
  const a = new Date(`${startYmd}T00:00:00`).getTime();
  const b = new Date(`${endYmd}T00:00:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return -1;
  return Math.floor((b - a) / 86_400_000) + 1;
}

function formatUnixLocal(unix: number): string {
  if (!unix) return '—';
  return new Date(unix * 1000).toLocaleString();
}

export default function SalesShopeeOrdersPage() {
  const canAccess = canConnectShopeeShop();
  const [shops, setShops] = useState<ShopeeConnectedShop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [shopsError, setShopsError] = useState('');
  const [shopId, setShopId] = useState<number>(0);
  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth());
  const [endDate, setEndDate] = useState(getTodayFormatted());
  const [orderStatus, setOrderStatus] = useState('COMPLETED');
  const [cancelBucket, setCancelBucket] = useState('');
  const [excludePembatalan, setExcludePembatalan] = useState(true);
  const [preview, setPreview] = useState<ShopeeOrdersPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Shopee Orders · Sales · EcomHub';
  }, []);

  const loadShops = useCallback(async () => {
    if (!canAccess) {
      setShopsLoading(false);
      setShops([]);
      return;
    }
    setShopsError('');
    setShopsLoading(true);
    try {
      const data = await shopeeAuthApi.listConnectedShops();
      const list = Array.isArray(data) ? data.filter((s) => s.is_active) : [];
      setShops(list);
      setShopId((prev) => {
        if (prev && list.some((s) => s.shop_id === prev)) return prev;
        return list[0]?.shop_id ?? 0;
      });
    } catch (err) {
      setShops([]);
      setShopId(0);
      setShopsError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load connected shops'
      );
    } finally {
      setShopsLoading(false);
    }
  }, [canAccess]);

  useEffect(() => {
    void loadShops();
  }, [loadShops]);

  const cancelBucketVisible = showCancelBucketFilter(orderStatus);
  const excludePembatalanVisible = showExcludePembatalan(orderStatus);

  const handleToday = () => {
    const today = getTodayFormatted();
    setStartDate(today);
    setEndDate(today);
  };

  const handleThisMonth = () => {
    setStartDate(getFirstDayOfCurrentMonth());
    setEndDate(getTodayFormatted());
  };

  const handleLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    setStartDate(formatDateForAPI(start));
    setEndDate(formatDateForAPI(end));
  };

  const handleLoad = async () => {
    setError('');
    setPreview(null);

    if (!shopId) {
      setError('Connect a Shopee shop first (Integrations → Shopee).');
      return;
    }

    const span = daySpanInclusive(startDate, endDate);
    if (span < 1) {
      setError('End date must be on or after start date.');
      return;
    }
    if (span > MAX_RANGE_DAYS) {
      setError(`Date range must be ≤ ${MAX_RANGE_DAYS} days (Shopee preview limit).`);
      return;
    }

    setIsLoading(true);
    try {
      const data = await shopeeAuthApi.previewOrders({
        shop_id: shopId,
        time_from: startOfDayUnix(startDate),
        time_to: endOfDayUnix(endDate),
        fetch_all: true,
        order_status: orderStatus || undefined,
        cancel_bucket: cancelBucketVisible ? cancelBucket || undefined : undefined,
        exclude_pembatalan: excludePembatalanVisible ? excludePembatalan : undefined,
      });
      setPreview(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load Shopee order preview'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Shopee Orders" />

      {!canAccess ? (
        <Card title="Access">
          <p className="text-sm text-gray-600">
            Viewing Shopee sales preview requires an admin or superadmin account.
          </p>
        </Card>
      ) : (
        <>
          <Card title="Filters">
            {shopsLoading ? (
              <p className="text-sm text-gray-500">Loading shops…</p>
            ) : shopsError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {shopsError}
              </p>
            ) : shops.length === 0 ? (
              <p className="text-sm text-gray-600">
                No active Shopee shop. Connect one under{' '}
                <Link href="/integrations/shopee" className="text-blue-600 hover:underline">
                  Integrations → Shopee
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="min-w-40">
                    <label className="mb-2 block text-sm font-medium text-gray-700">Shop</label>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={shopId || ''}
                      onChange={(e) => setShopId(Number(e.target.value))}
                    >
                      {shops.map((s) => (
                        <option key={s.id} value={s.shop_id}>
                          {s.shop_id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-40">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Start date
                    </label>
                    <DatePicker value={startDate} onChange={setStartDate} max={endDate} />
                  </div>
                  <div className="min-w-40">
                    <label className="mb-2 block text-sm font-medium text-gray-700">End date</label>
                    <DatePicker
                      value={endDate}
                      onChange={setEndDate}
                      min={startDate}
                      max={getTodayFormatted()}
                    />
                  </div>
                  <div className="min-w-40">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Order status
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={orderStatus}
                      onChange={(e) => {
                        const next = e.target.value;
                        setOrderStatus(next);
                        if (!showCancelBucketFilter(next)) {
                          setCancelBucket('');
                        }
                        if (showExcludePembatalan(next)) {
                          setExcludePembatalan(true);
                        }
                      }}
                    >
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="">All statuses</option>
                      <option value="READY_TO_SHIP">READY_TO_SHIP</option>
                      <option value="PROCESSED">PROCESSED</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="TO_CONFIRM_RECEIVE">TO_CONFIRM_RECEIVE</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="TO_RETURN">TO_RETURN</option>
                    </select>
                  </div>
                  {cancelBucketVisible ? (
                    <div className="min-w-44">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Cancel bucket
                      </label>
                      <select
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={cancelBucket}
                        onChange={(e) => setCancelBucket(e.target.value)}
                      >
                        <option value="">All buckets</option>
                        <option value="pembatalan">Pembatalan (no pickup)</option>
                        <option value="pengembalian">Returns (approx)</option>
                      </select>
                    </div>
                  ) : null}
                </div>

                {excludePembatalanVisible ? (
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={excludePembatalan}
                      onChange={(e) => setExcludePembatalan(e.target.checked)}
                    />
                    Exclude pembatalan (cancel before pickup)
                  </label>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" type="button" onClick={handleToday}>
                    Today
                  </Button>
                  <Button variant="secondary" size="sm" type="button" onClick={handleThisMonth}>
                    This month
                  </Button>
                  <Button variant="secondary" size="sm" type="button" onClick={handleLast7Days}>
                    Last 7 days
                  </Button>
                  <Button onClick={handleLoad} isLoading={isLoading} disabled={!shopId}>
                    Load preview
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  Max {MAX_RANGE_DAYS} days. Uses <code className="font-mono">fetch_all=true</code>{' '}
                  (Core splits ≤15d windows). Escrow = seller expected receive; buyer amount = GMV.
                  Cancel bucket only for CANCELLED. On All statuses: optional exclude pembatalan
                  (early cancel, no pickup) — default on. Real returns:{' '}
                  <Link href="/sales/returns" className="text-blue-600 hover:underline">
                    Sales → Shopee Returns
                  </Link>
                  .
                </p>
              </div>
            )}
          </Card>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {preview ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card title="Orders">
                  <p className="text-2xl font-semibold tabular-nums text-gray-900">
                    {preview.order_count}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    shop {preview.shop_id}
                    {preview.token_refreshed ? ' · token refreshed' : ''}
                  </p>
                </Card>
                <Card title="Total qty">
                  <p className="text-2xl font-semibold tabular-nums text-gray-900">
                    {preview.total_quantity ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Item units (SKU sum)</p>
                </Card>
                <Card title="Total escrow">
                  <p className="text-2xl font-semibold tabular-nums text-gray-900">
                    {formatCurrency(preview.total_escrow_amount)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Seller expected (primary)</p>
                </Card>
                <Card title="Total buyer amount">
                  <p className="text-2xl font-semibold tabular-nums text-gray-900">
                    {formatCurrency(preview.total_buyer_amount)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Buyer GMV (not seller net)</p>
                </Card>
              </div>

              <Card title="SKU summary">
                {(preview.sku_summary ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No SKU lines in this range.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="px-3 py-2 font-medium">SKU</th>
                          <th className="px-3 py-2 font-medium text-right">Qty</th>
                          <th className="px-3 py-2 font-medium text-right">Orders</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.sku_summary.map((row) => (
                          <tr key={row.sku} className="text-gray-900">
                            <td className="px-3 py-2 font-mono">{row.sku || '—'}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{row.quantity}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{row.order_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card title="Orders">
                {(preview.orders ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No orders in this range.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="px-3 py-2 font-medium">Order SN</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                          {cancelBucketVisible ? (
                            <>
                              <th className="px-3 py-2 font-medium">Bucket</th>
                              <th className="px-3 py-2 font-medium">Cancel reason</th>
                            </>
                          ) : null}
                          <th className="px-3 py-2 font-medium text-right">Escrow</th>
                          <th className="px-3 py-2 font-medium text-right">Buyer</th>
                          <th className="px-3 py-2 font-medium">Created</th>
                          <th className="px-3 py-2 font-medium">SKUs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.orders.map((o) => (
                          <tr key={o.order_sn} className="text-gray-900">
                            <td className="px-3 py-2 font-mono">{o.order_sn}</td>
                            <td className="px-3 py-2">{o.order_status || '—'}</td>
                            {cancelBucketVisible ? (
                              <>
                                <td className="px-3 py-2 text-gray-600">
                                  {o.cancel_bucket || '—'}
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-600">
                                  {o.cancel_reason || '—'}
                                </td>
                              </>
                            ) : null}
                            <td className="px-3 py-2 text-right tabular-nums">
                              {formatCurrency(o.escrow_amount ?? 0)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {formatCurrency(o.total_amount ?? 0)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                              {formatUnixLocal(o.create_time ?? 0)}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-600">
                              {(o.item_skus ?? []).join(', ') || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
