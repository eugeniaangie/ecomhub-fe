'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { formatCurrency, formatDate, formatDateForAPI } from '@/lib/utils/formatters';
import { financeReportsApi } from '@/lib/services/financeApi';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/lib/utils/pagination';
import type { AccountTransactionBalance, AccountTransaction } from '@/lib/types/finance';

export default function FinanceDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [bankShopeeBalance, setBankShopeeBalance] = useState<AccountTransactionBalance | null>(null);
  const [walletBalance, setWalletBalance] = useState<AccountTransactionBalance | null>(null);
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [startDate, setStartDate] = useState('2025-11-01');
  const [endDate, setEndDate] = useState(formatDateForAPI(new Date()));
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [bankData, walletData, transactionsData] = await Promise.all([
        financeReportsApi.getCurrentBalanceBankShopee({
          start_date: startDate,
          end_date: endDate,
        }),
        financeReportsApi.getCurrentBalanceShopeeWallet({
          start_date: startDate,
          end_date: endDate,
        }),
        financeReportsApi.getTransactionsShopee({
          start_date: startDate,
          end_date: endDate,
          page: DEFAULT_PAGE,
          limit: DEFAULT_PAGE_SIZE,
        }),
      ]);

      // Balance endpoints return array, get first item
      setBankShopeeBalance(bankData[0] || null);
      setWalletBalance(walletData[0] || null);
      setTransactions(transactionsData.results);
      setTransactionsTotal(transactionsData.total_results);
    } catch (err) {
      console.error('Error fetching finance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  useEffect(() => {
    document.title = 'Finance Dashboard';
  }, []);

  const handleResetDateRange = () => {
    setStartDate('2025-11-01');
    setEndDate(formatDateForAPI(new Date()));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance Dashboard</h1>
        <p className="text-gray-600">
          Overview of your Neobank account balance and expenses
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Total Debit</h3>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {bankShopeeBalance && walletBalance
                    ? formatCurrency(bankShopeeBalance.total_debit + walletBalance.total_debit)
                    : 'Rp 0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Money in</p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Total Credit</h3>
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
                        d="M20 12H4"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {bankShopeeBalance && walletBalance
                    ? formatCurrency(bankShopeeBalance.total_credit + walletBalance.total_credit)
                    : 'Rp 0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Money out</p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Current Balance</h3>
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                {(() => {
                  const totalBalance = bankShopeeBalance && walletBalance
                    ? bankShopeeBalance.current_balance + walletBalance.current_balance
                    : 0;
                  return (
                    <p className={`text-2xl font-bold ${
                      totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(totalBalance)}
                    </p>
                  );
                })()}
                <p className="text-xs text-gray-500 mt-1">Net balance</p>
              </div>
            </Card>
          </div>

          {/* All Transactions */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Latest Transactions</h2>
                {transactionsTotal > 0 && (
                  <span className="text-sm text-gray-500">
                    Showing {transactions.length} of {transactionsTotal}
                  </span>
                )}
              </div>

              {transactions.length > 0 ? (
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
                          Debit
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction, idx) => (
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
                                    <div className="text-xs text-gray-400">
                                      {formatCurrency(partner.amount)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                            {transaction.account_debit > 0 ? (
                              <span className="font-medium text-green-600">
                                {formatCurrency(transaction.account_debit)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                            {transaction.account_credit > 0 ? (
                              <span className="font-medium text-red-600">
                                {formatCurrency(transaction.account_credit)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No transactions found for the selected date range
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

