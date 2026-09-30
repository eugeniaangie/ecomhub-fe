'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatCurrency, formatDate, formatDateForAPI } from '@/lib/utils/formatters';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination';
import { financeReportsApi } from '@/lib/services/financeApi';
import type { AdExpenses, AccountTransaction } from '@/lib/types/finance';

export default function AdDashboardPage() {
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [totalAdExpenses, setTotalAdExpenses] = useState<AdExpenses | null>(null);
  const [shopeeAdExpenses, setShopeeAdExpenses] = useState<AdExpenses | null>(null);
  const [metaAdExpenses, setMetaAdExpenses] = useState<AdExpenses | null>(null);
  const [tiktokAdExpenses, setTiktokAdExpenses] = useState<AdExpenses | null>(null);
  const [adExpensesDetail, setAdExpensesDetail] = useState<AccountTransaction[]>([]);
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [startDate, setStartDate] = useState('2025-11-01');
  const [endDate, setEndDate] = useState(formatDateForAPI(new Date()));
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      setError(null);

      const [totalData, shopeeData, metaData, tiktokData] = await Promise.all([
        financeReportsApi.getAdExpensesTotal({
          start_date: startDate,
          end_date: endDate,
        }),
        financeReportsApi.getAdExpensesShopee({
          start_date: startDate,
          end_date: endDate,
        }),
        financeReportsApi.getAdExpensesMeta({
          start_date: startDate,
          end_date: endDate,
        }),
        financeReportsApi.getAdExpensesTikTok({
          start_date: startDate,
          end_date: endDate,
        }),
      ]);

      setTotalAdExpenses(totalData);
      setShopeeAdExpenses(shopeeData);
      setMetaAdExpenses(metaData);
      setTiktokAdExpenses(tiktokData);
    } catch (err) {
      console.error('Error fetching ad expenses summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ad expenses data');
    } finally {
      setLoadingSummary(false);
    }
  }, [startDate, endDate]);

  const fetchDetail = useCallback(async () => {
    try {
      setLoadingDetail(true);
      setError(null);

      const detailData = await financeReportsApi.getAdExpensesDetail({
        start_date: startDate,
        end_date: endDate,
        page: currentPage,
        limit: pageSize,
      });

      setAdExpensesDetail(detailData.results);
      setTotalPages(detailData.total_pages);
      setTotalResults(detailData.total_results);
    } catch (err) {
      console.error('Error fetching ad expenses detail:', err);
      setAdExpensesDetail([]);
      setTotalPages(0);
      setTotalResults(0);
      setError(err instanceof Error ? err.message : 'Failed to load ad expenses detail');
    } finally {
      setLoadingDetail(false);
    }
  }, [startDate, endDate, currentPage, pageSize]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    document.title = 'Ad Expenses Dashboard';
  }, []);

  const handleResetDateRange = () => {
    setStartDate('2025-11-01');
    setEndDate(formatDateForAPI(new Date()));
    setCurrentPage(DEFAULT_PAGE);
  };

  const loading = loadingSummary || loadingDetail;

  return (
    <div>
      <PageHeader
        className="mb-8"
        title="Ad Expenses"
        description="Overview of your advertising expenses across all platforms"
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-50 flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <DatePicker
              value={startDate}
              onChange={(value) => {
                if (value <= endDate) {
                  setStartDate(value);
                  setCurrentPage(DEFAULT_PAGE);
                }
              }}
              max={endDate}
            />
          </div>
          <div className="min-w-50 flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              End Date
            </label>
            <DatePicker
              value={endDate}
              onChange={(value) => {
                if (value >= startDate) {
                  setEndDate(value);
                  setCurrentPage(DEFAULT_PAGE);
                }
              }}
              min={startDate}
            />
          </div>
          <div>
            <button
              type="button"
              onClick={handleResetDateRange}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading && !totalAdExpenses ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
            <Card>
              <div className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-600">Total Ad Expense</h3>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {totalAdExpenses ? formatCurrency(totalAdExpenses.total_ad_expense) : 'Rp 0'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {totalAdExpenses
                    ? `${totalAdExpenses.total_transactions} transactions`
                    : '0 transactions'}
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-600">Shopee Ads</h3>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {shopeeAdExpenses
                    ? formatCurrency(shopeeAdExpenses.total_ad_expense)
                    : 'Rp 0'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {shopeeAdExpenses
                    ? `${shopeeAdExpenses.total_transactions} transactions`
                    : '0 transactions'}
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-600">Meta Ads</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {metaAdExpenses ? formatCurrency(metaAdExpenses.total_ad_expense) : 'Rp 0'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {metaAdExpenses
                    ? `${metaAdExpenses.total_transactions} transactions`
                    : '0 transactions'}
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-600">TikTok Ads</h3>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {tiktokAdExpenses
                    ? formatCurrency(tiktokAdExpenses.total_ad_expense)
                    : 'Rp 0'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {tiktokAdExpenses
                    ? `${tiktokAdExpenses.total_transactions} transactions`
                    : '0 transactions'}
                </p>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Ad Expenses Detail</h2>

              {loadingDetail ? (
                <div className="py-8 text-center text-gray-500">Loading detail…</div>
              ) : adExpensesDetail.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Entry Number
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Description
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Account
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Partner Account
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {adExpensesDetail.map((transaction, idx) => (
                          <tr key={`${transaction.journal_entry_id}-${idx}`} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                              {formatDate(transaction.entry_date)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                              {transaction.entry_number}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div>
                                <div className="font-medium">{transaction.entry_description}</div>
                                {transaction.line_description && (
                                  <div className="mt-0.5 text-xs text-gray-500">
                                    {transaction.line_description}
                                  </div>
                                )}
                                {transaction.reference_number && (
                                  <div className="mt-0.5 text-xs text-gray-400">
                                    Ref: {transaction.reference_number}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div>
                                <div className="font-medium">{transaction.account_name}</div>
                                <div className="text-xs text-gray-500">
                                  {transaction.account_code}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {transaction.partner_accounts &&
                              transaction.partner_accounts.length > 0 ? (
                                <div>
                                  {transaction.partner_accounts.map((partner, pIdx) => (
                                    <div key={pIdx} className={pIdx > 0 ? 'mt-2' : ''}>
                                      <div className="font-medium">{partner.account_name}</div>
                                      <div className="text-xs text-gray-500">
                                        {partner.account_code} ({partner.account_type})
                                      </div>
                                      {partner.description && (
                                        <div className="mt-0.5 text-xs text-gray-400">
                                          {partner.description}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-red-600">
                              {formatCurrency(
                                transaction.account_debit > 0
                                  ? transaction.account_debit
                                  : transaction.partner_accounts &&
                                      transaction.partner_accounts.length > 0
                                    ? transaction.partner_accounts[0].amount
                                    : transaction.net_amount
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  transaction.status === 'posted'
                                    ? 'bg-green-100 text-green-800'
                                    : transaction.status === 'approved'
                                      ? 'bg-blue-100 text-blue-800'
                                      : transaction.status === 'draft'
                                        ? 'bg-gray-100 text-gray-800'
                                        : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalResults={totalResults}
                    pageSize={pageSize}
                    onPageChange={(page) => setCurrentPage(page)}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setCurrentPage(DEFAULT_PAGE);
                    }}
                  />
                </>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  No ad expenses found for the selected date range
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
