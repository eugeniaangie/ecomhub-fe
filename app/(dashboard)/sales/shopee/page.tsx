'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { canConnectShopeeShop } from '@/lib/authHelpers';
import {
  shopeeAuthApi,
  type ShopeeAdsSpendPreview,
  type ShopeeConnectedShop,
  type ShopeeOrderDetail,
  type ShopeeOrdersPreview,
} from '@/lib/services/integrationsApi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Modal } from '@/components/ui/Modal';
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
  const [adsSpend, setAdsSpend] = useState<ShopeeAdsSpendPreview | null>(null);
  const [adsSpendError, setAdsSpendError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detail, setDetail] = useState<ShopeeOrderDetail | null>(null);

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
    setAdsSpendError('');
    setPreview(null);
    setAdsSpend(null);

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

    const timeFrom = startOfDayUnix(startDate);
    const timeTo = endOfDayUnix(endDate);

    setIsLoading(true);
    try {
      const [ordersResult, adsResult] = await Promise.allSettled([
        shopeeAuthApi.previewOrders({
          shop_id: shopId,
          time_from: timeFrom,
          time_to: timeTo,
          fetch_all: true,
          order_status: orderStatus || undefined,
          cancel_bucket: cancelBucketVisible ? cancelBucket || undefined : undefined,
          exclude_pembatalan: excludePembatalanVisible ? excludePembatalan : undefined,
        }),
        shopeeAuthApi.previewAdsSpend({
          shop_id: shopId,
          time_from: timeFrom,
          time_to: timeTo,
        }),
      ]);

      if (ordersResult.status === 'fulfilled') {
        setPreview(ordersResult.value);
      } else {
        const err = ordersResult.reason;
        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to load Shopee order preview'
        );
      }

      if (adsResult.status === 'fulfilled') {
        setAdsSpend(adsResult.value);
      } else {
        const err = adsResult.reason;
        setAdsSpendError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to load Shopee ads spend'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenOrderDetail = async (orderSn: string) => {
    if (!shopId || !orderSn) return;
    setDetailOpen(true);
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const data = await shopeeAuthApi.getOrderDetail({
        shop_id: shopId,
        order_sn: orderSn,
      });
      setDetail(data);
    } catch (err) {
      setDetailError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load order detail'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseOrderDetail = () => {
    setDetailOpen(false);
    setDetail(null);
    setDetailError('');
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

          {preview || adsSpend || adsSpendError ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {preview ? (
                  <>
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
                  </>
                ) : null}
                <Card title="Ads spend">
                  {adsSpendError ? (
                    <>
                      <p className="text-sm text-red-700">{adsSpendError}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Live Partner CPC expense (not wallet / not JE)
                      </p>
                    </>
                  ) : adsSpend ? (
                    <>
                      <p className="text-2xl font-semibold tabular-nums text-gray-900">
                        {formatCurrency(adsSpend.total_ads_spend)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Live Partner CPC expense
                        {adsSpend.used_hourly_api ? ' · hourly (1 day)' : ''}
                        {adsSpend.token_refreshed ? ' · token refreshed' : ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">—</p>
                  )}
                </Card>
              </div>

              {preview ? (
                <>
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
                <p className="mb-3 text-xs text-gray-500">
                  Click a row for buyer / original / fee lines / escrow net.
                </p>
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
                          <th className="px-3 py-2 font-medium">Created</th>
                          <th className="px-3 py-2 font-medium">SKUs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.orders.map((o) => (
                          <tr
                            key={o.order_sn}
                            className="cursor-pointer text-gray-900 hover:bg-gray-50"
                            onClick={() => void handleOpenOrderDetail(o.order_sn)}
                          >
                            <td className="px-3 py-2 font-mono text-blue-700">{o.order_sn}</td>
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
          ) : null}
        </>
      )}

      <Modal
        isOpen={detailOpen}
        onClose={handleCloseOrderDetail}
        title={detail?.order_sn ? `Order ${detail.order_sn}` : 'Order detail'}
        size="lg"
        footer={
          <Button variant="secondary" onClick={handleCloseOrderDetail}>
            Close
          </Button>
        }
      >
        {detailLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : detailError ? (
          <p className="text-sm text-red-700">{detailError}</p>
        ) : detail ? (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-medium text-gray-900">{detail.order_status || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="font-medium text-gray-900">
                  {formatUnixLocal(detail.create_time ?? 0)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-gray-200 px-3 py-2">
                <p className="text-xs text-gray-500">Original</p>
                <p className="text-lg font-semibold tabular-nums text-gray-900">
                  {formatCurrency(detail.original_price)}
                </p>
                <p className="text-xs text-gray-500">Listing before shop discount</p>
              </div>
              <div className="rounded-md border border-gray-200 px-3 py-2">
                <p className="text-xs text-gray-500">After shop discount</p>
                <p className="text-lg font-semibold tabular-nums text-gray-900">
                  {formatCurrency(detail.selling_price)}
                </p>
                <p className="text-xs text-gray-500">Selling price (not buyer GMV)</p>
              </div>
              <div className="rounded-md border border-gray-200 px-3 py-2">
                <p className="text-xs text-gray-500">Escrow (bersih expect)</p>
                <p className="text-lg font-semibold tabular-nums text-gray-900">
                  {detail.escrow_available
                    ? formatCurrency(detail.escrow_amount)
                    : '—'}
                </p>
                <p className="text-xs text-gray-500">
                  {detail.escrow_available
                    ? 'Seller expected receive'
                    : 'Escrow unavailable for this order'}
                </p>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <p className="font-medium text-gray-900">Rincian (Seller Centre style)</p>
                {detail.escrow_available ? (
                  <p className="text-sm text-gray-700">
                    Total potongan:{' '}
                    <span className="font-semibold tabular-nums text-red-700">
                      {formatCurrency(-(detail.total_deductions ?? 0))}
                    </span>
                  </p>
                ) : null}
              </div>
              {(detail.deductions ?? []).length === 0 ? (
                <p className="text-gray-500">
                  {detail.escrow_available
                    ? 'No deduction lines.'
                    : 'No escrow breakdown.'}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="px-3 py-2 font-medium">Line</th>
                        <th className="px-3 py-2 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {detail.deductions.map((line) => (
                        <tr key={line.key} className="text-gray-900">
                          <td className="px-3 py-2">{line.label}</td>
                          <td
                            className={`px-3 py-2 text-right tabular-nums ${
                              line.amount < 0 ? 'text-red-700' : 'text-gray-900'
                            }`}
                          >
                            {formatCurrency(line.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 font-medium text-gray-900">Items</p>
              {(detail.items ?? []).length === 0 ? (
                <p className="text-gray-500">No item lines.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="px-3 py-2 font-medium">SKU</th>
                        <th className="px-3 py-2 font-medium text-right">Qty</th>
                        <th className="px-3 py-2 font-medium text-right">Original</th>
                        <th className="px-3 py-2 font-medium text-right">After discount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {detail.items.map((it, idx) => (
                        <tr key={`${it.sku}-${idx}`} className="text-gray-900">
                          <td className="px-3 py-2 font-mono">{it.sku}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{it.quantity}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatCurrency(it.original_price ?? 0)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatCurrency(it.discounted_price ?? 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-3 flex items-baseline justify-between gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                <div>
                  <p className="text-xs text-gray-500">Buyer amount</p>
                  <p className="text-xs text-gray-500">GMV buyer (vouchers already in)</p>
                </div>
                <p className="text-base font-semibold tabular-nums text-gray-900">
                  {formatCurrency(detail.buyer_amount)}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
