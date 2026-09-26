'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { formatCurrency, formatDate, formatDateForAPI } from '@/lib/utils/formatters';
import { financeReportsApi } from '@/lib/services/financeApi';
import type { AdExpenses, AccountTransaction } from '@/lib/types/finance';

export default function AdDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [totalAdExpenses, setTotalAdExpenses] = useState<AdExpenses | null>(null);
  const [shopeeAdExpenses, setShopeeAdExpenses] = useState<AdExpenses | null>(null);
  const [metaAdExpenses, setMetaAdExpenses] = useState<AdExpenses | null>(null);
  const [tiktokAdExpenses, setTiktokAdExpenses] = useState<AdExpenses | null>(null);
  const [adExpensesDetail, setAdExpensesDetail] = useState<AccountTransaction[]>([]);
  const [startDate, setStartDate] = useState('2025-11-01');
  const [endDate, setEndDate] = useState(formatDateForAPI(new Date()));
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [totalData, shopeeData, metaData, tiktokData, detailData] = await Promise.all([
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
        financeReportsApi.getAdExpensesDetail({
          start_date: startDate,
          end_date: endDate,
        }),
      ]);

      setTotalAdExpenses(totalData);
      setShopeeAdExpenses(shopeeData);
      setMetaAdExpenses(metaData);
      setTiktokAdExpenses(tiktokData);
      setAdExpensesDetail(detailData);
    } catch (err) {
      console.error('Error fetching ad expenses data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ad expenses data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  useEffect(() => {
    document.title = 'Ad Expenses Dashboard';
  }, []);

  const handleResetDateRange = () => {
    setStartDate('2025-11-01');
    setEndDate(formatDateForAPI(new Date()));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ad Expenses Dashboard</h1>
        <p className="text-gray-600">
          Overview of your advertising expenses across all platforms
        </p>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <DatePicker
              value={startDate}
              onChange={(value) => {
                if (value <= endDate) {
                  setStartDate(value);
                }
              }}
              max={endDate}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <DatePicker
              value={endDate}
              onChange={(value) => {
                if (value >= startDate) {
                  setEndDate(value);
                }
              }}
              min={startDate}
            />
          </div>
          <div>
            <button
              onClick={handleResetDateRange}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Total Ad Expense</h3>
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {totalAdExpenses ? formatCurrency(totalAdExpenses.total_ad_expense) : 'Rp 0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {totalAdExpenses ? `${totalAdExpenses.total_transactions} transactions` : '0 transactions'}
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Shopee Ads</h3>
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {shopeeAdExpenses ? formatCurrency(shopeeAdExpenses.total_ad_expense) : 'Rp 0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {shopeeAdExpenses ? `${shopeeAdExpenses.total_transactions} transactions` : '0 transactions'}
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Meta Ads</h3>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {metaAdExpenses ? formatCurrency(metaAdExpenses.total_ad_expense) : 'Rp 0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {metaAdExpenses ? `${metaAdExpenses.total_transactions} transactions` : '0 transactions'}
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">TikTok Ads</h3>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {tiktokAdExpenses ? formatCurrency(tiktokAdExpenses.total_ad_expense) : 'Rp 0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {tiktokAdExpenses ? `${tiktokAdExpenses.total_transactions} transactions` : '0 transactions'}
                </p>
              </div>
            </Card>
          </div>

          {/* Ad Expenses Detail */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ad Expenses Detail</h2>

              {adExpensesDetail.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entry Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Partner Account
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {adExpensesDetail.map((transaction, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.entry_date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {transaction.entry_number}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{transaction.entry_description}</div>
                              {transaction.line_description && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {transaction.line_description}
                                </div>
                              )}
                              {transaction.reference_number && (
                                <div className="text-xs text-gray-400 mt-0.5">
                                  Ref: {transaction.reference_number}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div>
                              <div className="font-medium">{transaction.account_name}</div>
                              <div className="text-xs text-gray-500">{transaction.account_code}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {transaction.partner_accounts && transaction.partner_accounts.length > 0 ? (
                              <div>
                                {transaction.partner_accounts.map((partner, pIdx) => (
                                  <div key={pIdx} className={pIdx > 0 ? 'mt-2' : ''}>
                                    <div className="font-medium">{partner.account_name}</div>
                                    <div className="text-xs text-gray-500">
                                      {partner.account_code} ({partner.account_type})
                                    </div>
                                    {partner.description && (
                                      <div className="text-xs text-gray-400 mt-0.5">
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-red-600">
                            {formatCurrency(
                              transaction.account_debit > 0
                                ? transaction.account_debit
                                : transaction.partner_accounts && transaction.partner_accounts.length > 0
                                ? transaction.partner_accounts[0].amount
                                : transaction.net_amount
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === 'posted'
                                ? 'bg-green-100 text-green-800'
                                : transaction.status === 'approved'
                                ? 'bg-blue-100 text-blue-800'
                                : transaction.status === 'draft'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
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

