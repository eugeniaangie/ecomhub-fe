'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { canConnectShopeeShop } from '@/lib/authHelpers';
import {
  shopeeAuthApi,
  type ShopeeConnectedShop,
  type ShopeeReturnsPreview,
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

function formatReturnSolution(solution: number | undefined): string {
  if (solution === 0) return 'Return + refund';
  if (solution === 1) return 'Refund only';
  return '—';
}

export default function SalesShopeeReturnsPage() {
  const canAccess = canConnectShopeeShop();
  const [shops, setShops] = useState<ShopeeConnectedShop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [shopsError, setShopsError] = useState('');
  const [shopId, setShopId] = useState<number>(0);
  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth());
  const [endDate, setEndDate] = useState(getTodayFormatted());
  const [returnStatus, setReturnStatus] = useState('');
  const [preview, setPreview] = useState<ShopeeReturnsPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Returns · Sales · EcomHub';
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
      const data = await shopeeAuthApi.previewReturns({
        shop_id: shopId,
        time_from: startOfDayUnix(startDate),
        time_to: endOfDayUnix(endDate),
        fetch_all: true,
        return_status: returnStatus || undefined,
      });
      setPreview(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load Shopee returns preview'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Returns" />

      {!canAccess ? (
        <Card title="Access">
          <p className="text-sm text-gray-600">
            Viewing Shopee returns requires an admin or superadmin account.
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
                  <div className="min-w-44">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Return status
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={returnStatus}
                      onChange={(e) => setReturnStatus(e.target.value)}
                    >
                      <option value="">All statuses</option>
                      <option value="REQUESTED">REQUESTED</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="JUDGING">JUDGING</option>
                      <option value="REFUND_PAID">REFUND_PAID</option>
                      <option value="CLOSED">CLOSED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SELLER_DISPUTE">SELLER_DISPUTE</option>
                    </select>
                  </div>
                </div>

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
                  Real Seller Centre returns via <code className="font-mono">get_return_list</code>{' '}
                  (not the Orders cancel-bucket approx). Date filter = return create time. Max{' '}
                  {MAX_RANGE_DAYS} days with <code className="font-mono">fetch_all=true</code>.
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
              <div className="grid gap-4 sm:grid-cols-3">
                <Card title="Returns">
                  <p className="text-2xl font-semibold tabular-nums text-gray-900">
                    {preview.return_count}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    shop {preview.shop_id}
                    {preview.token_refreshed ? ' · token refreshed' : ''}
                  </p>
                </Card>
                <Card title="Total pcs">
                  <p className="text-2xl font-semibold tabular-nums text-gray-900">
                    {preview.total_quantity ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Item units across returns</p>
                </Card>
                <Card title="Total refund">
                  <p className="text-2xl font-semibold tabular-nums text-gray-900">
                    {formatCurrency(preview.total_refund_amount)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Refund nominal (from API)</p>
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
                          <th className="px-3 py-2 font-medium text-right">Returns</th>
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

              <Card title="Returns">
                {(preview.returns ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No returns in this range.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="px-3 py-2 font-medium">Return SN</th>
                          <th className="px-3 py-2 font-medium">Order SN</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                          <th className="px-3 py-2 font-medium text-right">Refund</th>
                          <th className="px-3 py-2 font-medium text-right">Qty</th>
                          <th className="px-3 py-2 font-medium">Reason</th>
                          <th className="px-3 py-2 font-medium">Solution</th>
                          <th className="px-3 py-2 font-medium">Created</th>
                          <th className="px-3 py-2 font-medium">SKUs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.returns.map((r) => (
                          <tr key={r.return_sn} className="text-gray-900">
                            <td className="px-3 py-2 font-mono">{r.return_sn}</td>
                            <td className="px-3 py-2 font-mono">{r.order_sn || '—'}</td>
                            <td className="px-3 py-2">{r.status || '—'}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {formatCurrency(r.refund_amount ?? 0)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">{r.quantity}</td>
                            <td className="max-w-56 px-3 py-2 text-xs text-gray-600">
                              <div>{r.reason || '—'}</div>
                              {r.text_reason ? (
                                <div className="mt-0.5 text-gray-500">{r.text_reason}</div>
                              ) : null}
                              {r.reassessed_request_reason ? (
                                <div className="mt-0.5 text-gray-500">
                                  Reassessed: {r.reassessed_request_reason}
                                </div>
                              ) : null}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">
                              <div>{formatReturnSolution(r.return_solution)}</div>
                              {r.needs_logistics ? (
                                <div className="mt-0.5 text-amber-700">Needs logistics</div>
                              ) : null}
                              {r.due_date ? (
                                <div className="mt-0.5">Due {formatUnixLocal(r.due_date)}</div>
                              ) : null}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                              {formatUnixLocal(r.create_time ?? 0)}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-600">
                              {(r.item_skus ?? []).join(', ') || '—'}
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
