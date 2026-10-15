'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { canConnectShopeeShop } from '@/lib/authHelpers';
import {
  shopeeAuthApi,
  type ShopeeReturnsPreview,
} from '@/lib/services/integrationsApi';
import { CatalogSkuCell } from '@/components/sales/CatalogSkuCell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { PageHeader } from '@/components/layout/PageHeader';
import { useTenant } from '@/components/layout/TenantProvider';
import {
  formatCurrency,
  formatDateForAPI,
  getFirstDayOfCurrentMonth,
  getTodayFormatted,
} from '@/lib/utils/formatters';

const MAX_RANGE_DAYS = 31;

type OriginTab = 'all' | 'buyer' | 'pembatalan' | 'system';

const ORIGIN_TABS: { id: OriginTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'buyer', label: 'Returns' },
  { id: 'pembatalan', label: 'Cancellations' },
  { id: 'system', label: 'Failed delivery' },
];

const SYSTEM_SUB_TYPES = [
  { value: '', label: 'All sub-types' },
  { value: 'failed_delivery', label: 'Failed delivery' },
  { value: 'lost', label: 'Lost' },
  { value: 'cod_rejected', label: 'COD rejected' },
  { value: 'other', label: 'Other' },
];

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

function formatOrigin(origin: string | undefined): string {
  switch (origin) {
    case 'buyer':
      return 'Return';
    case 'system':
      return 'Failed delivery';
    case 'pembatalan':
      return 'Cancellation';
    default:
      return origin || '—';
  }
}

function formatGoodsReturned(v: string | undefined): string {
  switch (v) {
    case 'yes':
      return 'Yes';
    case 'no':
      return 'No';
    case 'unknown':
      return 'Unknown';
    default:
      return '—';
  }
}

function originTabCount(preview: ShopeeReturnsPreview | null, tab: OriginTab): number | null {
  if (!preview) return null;
  switch (tab) {
    case 'buyer':
      return preview.buyer_count ?? null;
    case 'system':
      return preview.system_count ?? null;
    case 'pembatalan':
      return preview.pembatalan_count ?? null;
    case 'all': {
      if (
        preview.buyer_count == null &&
        preview.system_count == null &&
        preview.pembatalan_count == null
      ) {
        return null;
      }
      return (preview.buyer_count ?? 0) + (preview.system_count ?? 0) + (preview.pembatalan_count ?? 0);
    }
    default:
      return null;
  }
}

export default function SalesShopeeReturnsPage() {
  const canAccess = canConnectShopeeShop();
  const { ready: tenantReady } = useTenant();
  const [hasConnection, setHasConnection] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [connectionError, setConnectionError] = useState('');
  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth());
  const [endDate, setEndDate] = useState(getTodayFormatted());
  const [origin, setOrigin] = useState<OriginTab>('all');
  const [returnStatus, setReturnStatus] = useState('');
  const [subType, setSubType] = useState('');
  const [goodsReturned, setGoodsReturned] = useState('');
  const [preview, setPreview] = useState<ShopeeReturnsPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Shopee Returns · Sales · EcomHub';
  }, []);

  const loadConnection = useCallback(async () => {
    if (!canAccess || !tenantReady) {
      setConnectionLoading(false);
      setHasConnection(false);
      return;
    }
    setConnectionError('');
    setConnectionLoading(true);
    try {
      const data = await shopeeAuthApi.listConnectedShops();
      const list = Array.isArray(data) ? data.filter((s) => s.is_active) : [];
      setHasConnection(list.length > 0);
    } catch (err) {
      setHasConnection(false);
      setConnectionError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load Shopee connection'
      );
    } finally {
      setConnectionLoading(false);
    }
  }, [canAccess, tenantReady]);

  useEffect(() => {
    void loadConnection();
  }, [loadConnection]);

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

    if (!hasConnection) {
      setError('Connect a Shopee shop first (Settings → Shopee Integration).');
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
      // Omit shop_id — Core resolves inside active tenant (FE33 / F7b).
      const data = await shopeeAuthApi.previewReturns({
        time_from: startOfDayUnix(startDate),
        time_to: endOfDayUnix(endDate),
        fetch_all: true,
        origin,
        return_status: returnStatus || undefined,
        sub_type: subType || undefined,
        goods_returned: goodsReturned || undefined,
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

  const showReturnStatus = origin === 'all' || origin === 'buyer';
  const showSystemSubType = origin === 'all' || origin === 'system';

  return (
    <div className="space-y-6">
      <PageHeader title="Shopee Returns" />

      {!canAccess ? (
        <Card title="Access">
          <p className="text-sm text-gray-600">
            Viewing Shopee returns requires an admin or superadmin account.
          </p>
        </Card>
      ) : (
        <>
          <Card title="Filters">
            {connectionLoading ? (
              <p className="text-sm text-gray-500">Checking Shopee connection…</p>
            ) : connectionError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {connectionError}
              </p>
            ) : !hasConnection ? (
              <p className="text-sm text-gray-600">
                No active Shopee shop for this tenant.{' '}
                <Link href="/settings/integration/shopee" className="text-blue-600 hover:underline">
                  Connect in Settings
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-4">
                <div
                  className="flex flex-wrap gap-1 border-b border-gray-200 pb-px"
                  role="tablist"
                  aria-label="Return origin"
                >
                  {ORIGIN_TABS.map((tab) => {
                    const count = originTabCount(preview, tab.id);
                    const active = origin === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => {
                          setOrigin(tab.id);
                          if (tab.id !== 'system' && tab.id !== 'all') {
                            setSubType('');
                          }
                          if (tab.id === 'system' || tab.id === 'pembatalan') {
                            setReturnStatus('');
                          }
                        }}
                        className={`rounded-t-md px-3 py-2 text-sm font-medium transition-colors ${
                          active
                            ? 'border border-b-white border-gray-200 bg-white text-blue-700'
                            : 'border border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {tab.label}
                        {count != null ? (
                          <span
                            className={`ml-1.5 tabular-nums ${
                              active ? 'text-blue-600' : 'text-gray-400'
                            }`}
                          >
                            ({count})
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-end gap-4">
                  <div className="min-w-40">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Start date
                    </label>
                    <DatePicker
                      value={startDate}
                      onChange={setStartDate}
                      rangePartner={endDate}
                      rangeSide="start"
                      onRangeChange={(start, end) => {
                        setStartDate(start);
                        setEndDate(end);
                      }}
                      maxRangeDays={MAX_RANGE_DAYS}
                      max={getTodayFormatted()}
                    />
                  </div>
                  <div className="min-w-40">
                    <label className="mb-2 block text-sm font-medium text-gray-700">End date</label>
                    <DatePicker
                      value={endDate}
                      onChange={setEndDate}
                      rangePartner={startDate}
                      rangeSide="end"
                      onRangeChange={(start, end) => {
                        setStartDate(start);
                        setEndDate(end);
                      }}
                      maxRangeDays={MAX_RANGE_DAYS}
                      max={getTodayFormatted()}
                    />
                  </div>
                  {showReturnStatus ? (
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
                  ) : null}
                  {showSystemSubType ? (
                    <div className="min-w-44">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        System sub-type
                      </label>
                      <select
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={subType}
                        onChange={(e) => setSubType(e.target.value)}
                      >
                        {SYSTEM_SUB_TYPES.map((opt) => (
                          <option key={opt.value || 'all'} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  <div className="min-w-40">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Goods returned
                    </label>
                    <select
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={goodsReturned}
                      onChange={(e) => setGoodsReturned(e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="unknown">Unknown</option>
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
                  <Button onClick={handleLoad} isLoading={isLoading} disabled={!hasConnection}>
                    Load preview
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  Buyer rows from <code className="font-mono">get_return_list</code>; cancellations
                  and failed delivery from CANCELLED orders (dedup: buyer{' '}
                  <code className="font-mono">order_sn</code> wins). Date = create time per origin —
                  not Seller Centre open-queue counts. Max {MAX_RANGE_DAYS} days with{' '}
                  <code className="font-mono">fetch_all=true</code>.
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
                <Card title="Rows">
                  <p className="text-2xl font-semibold tabular-nums text-gray-900">
                    {preview.return_count}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    shop {preview.shop_id}
                    {preview.token_refreshed ? ' · token refreshed' : ''}
                    {preview.origin ? ` · origin=${preview.origin}` : ''}
                  </p>
                </Card>
                <Card title="Total pcs">
                  <p className="text-2xl font-semibold tabular-nums text-gray-900">
                    {preview.total_quantity ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Item units in filtered rows</p>
                </Card>
                <Card title="Total refund">
                  <p className="text-2xl font-semibold tabular-nums text-gray-900">
                    {formatCurrency(preview.total_refund_amount)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Buyer-return refunds only</p>
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
                        {preview.sku_summary.map((row, idx) => (
                          <tr
                            key={
                              row.variant_id != null
                                ? `v-${row.variant_id}`
                                : `${row.sku}-${row.item_id ?? 0}-${row.model_id ?? 0}-${idx}`
                            }
                            className="text-gray-900"
                          >
                            <td className="px-3 py-2">
                              <CatalogSkuCell row={row} />
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">{row.quantity}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{row.order_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card title="Rows">
                {(preview.returns ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No rows in this range.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="px-3 py-2 font-medium">Origin</th>
                          <th className="px-3 py-2 font-medium">Return / Order</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                          <th className="px-3 py-2 font-medium">Sub-type</th>
                          <th className="px-3 py-2 font-medium">Goods</th>
                          <th className="px-3 py-2 font-medium text-right">Refund</th>
                          <th className="px-3 py-2 font-medium text-right">Qty</th>
                          <th className="px-3 py-2 font-medium">Reason</th>
                          <th className="px-3 py-2 font-medium">Solution</th>
                          <th className="px-3 py-2 font-medium">Created</th>
                          <th className="px-3 py-2 font-medium">SKUs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.returns.map((r, idx) => (
                          <tr
                            key={
                              r.return_sn
                                ? r.return_sn
                                : `${r.origin ?? 'x'}-${r.order_sn ?? 'x'}-${idx}`
                            }
                            className="text-gray-900"
                          >
                            <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-gray-700">
                              {formatOrigin(r.origin)}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">
                              {r.return_sn ? (
                                <div>{r.return_sn}</div>
                              ) : (
                                <div className="text-gray-400">—</div>
                              )}
                              <div className="text-gray-600">{r.order_sn || '—'}</div>
                            </td>
                            <td className="px-3 py-2">{r.status || '—'}</td>
                            <td className="px-3 py-2 text-xs text-gray-600">
                              {r.sub_type || '—'}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">
                              {formatGoodsReturned(r.goods_returned)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {formatCurrency(r.refund_amount ?? 0)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">{r.quantity}</td>
                            <td className="max-w-56 px-3 py-2 text-xs text-gray-600">
                              {r.origin === 'buyer' ? (
                                <>
                                  <div>{r.reason || '—'}</div>
                                  {r.text_reason ? (
                                    <div className="mt-0.5 text-gray-500">{r.text_reason}</div>
                                  ) : null}
                                  {r.reassessed_request_reason ? (
                                    <div className="mt-0.5 text-gray-500">
                                      Reassessed: {r.reassessed_request_reason}
                                    </div>
                                  ) : null}
                                </>
                              ) : (
                                <div>{r.cancel_reason || r.reason || '—'}</div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">
                              {r.origin === 'buyer' ? (
                                <>
                                  <div>{formatReturnSolution(r.return_solution)}</div>
                                  {r.needs_logistics ? (
                                    <div className="mt-0.5 text-amber-700">Needs logistics</div>
                                  ) : null}
                                  {r.due_date ? (
                                    <div className="mt-0.5">Due {formatUnixLocal(r.due_date)}</div>
                                  ) : null}
                                </>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                              {formatUnixLocal(r.create_time ?? 0)}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">
                              {(r.items ?? []).length > 0 ? (
                                <ul className="space-y-1">
                                  {r.items!.map((it, itemIdx) => (
                                    <li
                                      key={
                                        it.variant_id != null
                                          ? `v-${it.variant_id}-${itemIdx}`
                                          : `${it.sku}-${itemIdx}`
                                      }
                                    >
                                      <CatalogSkuCell row={it} className="text-xs" />
                                      <span className="ml-1 tabular-nums text-gray-500">
                                        ×{it.quantity}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="font-mono">
                                  {(r.item_skus ?? []).join(', ') || '—'}
                                </span>
                              )}
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
