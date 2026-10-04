'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { canConnectShopeeShop } from '@/lib/authHelpers';
import {
  shopeeAuthApi,
  type ShopeeAdsPerformancePreview,
} from '@/lib/services/integrationsApi';
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

function formatRoas(v: number): string {
  if (!Number.isFinite(v) || v === 0) return '—';
  return v.toFixed(2);
}

function isYmd(s: string | null): s is string {
  return Boolean(s && /^\d{4}-\d{2}-\d{2}$/.test(s));
}

function ShopeeAdsFeed() {
  const canAccess = canConnectShopeeShop();
  const { ready: tenantReady, activeTenant } = useTenant();
  const searchParams = useSearchParams();
  const [hasConnection, setHasConnection] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [connectionError, setConnectionError] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const q = searchParams.get('start_date');
    return isYmd(q) ? q : getFirstDayOfCurrentMonth();
  });
  const [endDate, setEndDate] = useState(() => {
    const q = searchParams.get('end_date');
    return isYmd(q) ? q : getTodayFormatted();
  });
  const [preview, setPreview] = useState<ShopeeAdsPerformancePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [didAutoLoad, setDidAutoLoad] = useState(false);
  const [seriesOpen, setSeriesOpen] = useState(false);

  useEffect(() => {
    document.title = 'Shopee Ads · Sales · EcomHub';
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

  const handleLoad = useCallback(async () => {
    setError('');
    setPreview(null);

    if (!hasConnection) {
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
      // Omit shop_id — Core resolves inside active tenant (FE33 / F7b).
      const data = await shopeeAuthApi.previewAdsPerformance({
        time_from: startOfDayUnix(startDate),
        time_to: endOfDayUnix(endDate),
      });
      setPreview(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load Shopee ads performance'
      );
    } finally {
      setIsLoading(false);
    }
  }, [hasConnection, startDate, endDate]);

  useEffect(() => {
    if (didAutoLoad || connectionLoading || !hasConnection || !canAccess) return;
    const fromOverview =
      isYmd(searchParams.get('start_date')) || isYmd(searchParams.get('end_date'));
    if (!fromOverview) return;
    setDidAutoLoad(true);
    void handleLoad();
  }, [didAutoLoad, connectionLoading, hasConnection, canAccess, searchParams, handleLoad]);

  const maxSpend = useMemo(() => {
    if (!preview?.series?.length) return 0;
    return Math.max(...preview.series.map((r) => r.expense || 0), 0);
  }, [preview]);

  return (
    <div className="space-y-6">
      <PageHeader title="Shopee Ads" />

      {!canAccess ? (
        <Card title="Access">
          <p className="text-sm text-gray-600">
            Viewing Shopee Ads requires an admin or superadmin account.
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
                No active Shopee shop for this tenant
                {activeTenant?.name ? ` (${activeTenant.name})` : ''}. Connect one under{' '}
                <Link href="/integrations/shopee" className="text-blue-600 hover:underline">
                  Integrations → Shopee
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Tenant:{' '}
                  <span className="font-medium text-gray-900">
                    {activeTenant?.name ?? '—'}
                  </span>
                  {activeTenant?.shopee_shop_id ? (
                    <>
                      {' '}
                      · Shopee shop{' '}
                      <span className="font-mono">{activeTenant.shopee_shop_id}</span>
                    </>
                  ) : null}
                </p>
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
                  Shop-level CPC performance (same Partner daily/hourly APIs as the overview Ads
                  spend card). Wallet saldo is separate from spend. Max {MAX_RANGE_DAYS} days. Not
                  campaign/product breakdown.
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <Card title="Ads spend">
                  <p className="text-2xl font-semibold tabular-nums text-gray-900">
                    {formatCurrency(preview.total_ads_spend)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    shop {preview.shop_id}
                    {preview.used_hourly_api ? ' · hourly grain' : ''}
                    {preview.token_refreshed ? ' · token refreshed' : ''}
                  </p>
                </Card>
                <Card title="Broad ROAS">
                  <p className="text-2xl font-semibold tabular-nums text-gray-900">
                    {formatRoas(preview.broad_roas)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Period · broad GMV ÷ spend</p>
                </Card>
                <Card title="Broad GMV">
                  <p className="text-2xl font-semibold tabular-nums text-gray-900">
                    {formatCurrency(preview.broad_gmv)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Ad-attributed · {preview.broad_order} orders
                  </p>
                </Card>
                <Card title="Clicks">
                  <p className="text-2xl font-semibold tabular-nums text-gray-900">
                    {preview.clicks.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {preview.impression.toLocaleString()} impressions
                  </p>
                </Card>
                <Card title="Current Balance">
                  {preview.ads_wallet_balance != null ? (
                    <>
                      <p className="text-2xl font-semibold tabular-nums text-gray-900">
                        {formatCurrency(preview.ads_wallet_balance)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Remaining ads credit
                        {preview.balance_as_of
                          ? ` · ${formatUnixLocal(preview.balance_as_of)}`
                          : ''}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500">Unavailable</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {preview.balance_error || 'Balance unavailable'}
                      </p>
                    </>
                  )}
                </Card>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card title="Direct ROAS">
                  <p className="text-xl font-semibold tabular-nums text-gray-900">
                    {formatRoas(preview.direct_roas)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Direct GMV {formatCurrency(preview.direct_gmv)} · {preview.direct_order} orders
                  </p>
                </Card>
                <Card title="Direct GMV">
                  <p className="text-xl font-semibold tabular-nums text-gray-900">
                    {formatCurrency(preview.direct_gmv)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Advertised product only (vs broad = shop-wide after click)
                  </p>
                </Card>
              </div>

              <Card
                title={preview.series_grain === 'hourly' ? 'Hourly series' : 'Daily series'}
                collapsed={!seriesOpen}
                onToggleCollapse={() => setSeriesOpen((v) => !v)}
              >
                {(preview.series ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No performance rows for this range.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="px-3 py-2 font-medium">
                            {preview.series_grain === 'hourly' ? 'Date / hour' : 'Date'}
                          </th>
                          <th className="px-3 py-2 font-medium text-right">Spend</th>
                          <th className="hidden px-3 py-2 font-medium sm:table-cell">Bar</th>
                          <th className="px-3 py-2 font-medium text-right">Broad ROAS</th>
                          <th className="px-3 py-2 font-medium text-right">Broad GMV</th>
                          <th className="px-3 py-2 font-medium text-right">Clicks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {preview.series.map((row, idx) => {
                          const barPct =
                            maxSpend > 0 ? Math.round((row.expense / maxSpend) * 100) : 0;
                          const label =
                            preview.series_grain === 'hourly' && row.hour != null
                              ? `${row.date} · ${String(row.hour).padStart(2, '0')}:00`
                              : row.date;
                          return (
                            <tr key={`${row.date}-${row.hour ?? idx}`} className="text-gray-900">
                              <td className="whitespace-nowrap px-3 py-2">{label}</td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {formatCurrency(row.expense)}
                              </td>
                              <td className="hidden px-3 py-2 sm:table-cell">
                                <div className="h-2 w-28 overflow-hidden rounded bg-gray-100">
                                  <div
                                    className="h-full rounded bg-gray-400"
                                    style={{ width: `${barPct}%` }}
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {formatRoas(row.broad_roas)}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {formatCurrency(row.broad_gmv)}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {row.clicks.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
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

export default function SalesShopeeAdsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <PageHeader title="Shopee Ads" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      }
    >
      <ShopeeAdsFeed />
    </Suspense>
  );
}
