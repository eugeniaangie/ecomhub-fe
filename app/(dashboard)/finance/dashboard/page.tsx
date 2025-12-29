'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { formatCurrency, formatDate, getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth } from '@/lib/utils/formatters';
import { financeReportsApi } from '@/lib/services/financeApi';
import type { CurrentBalanceResponse, AdExpensesResponse } from '@/lib/types/finance';

export default function FinanceDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState<CurrentBalanceResponse | null>(null);
  const [adExpenses, setAdExpenses] = useState<AdExpensesResponse | null>(null);
  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth());
  const [endDate, setEndDate] = useState(getLastDayOfCurrentMonth());
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [balanceData, expensesData] = await Promise.all([
        financeReportsApi.getCurrentBalance({
          start_date: startDate,
          end_date: endDate,
        }),
        financeReportsApi.getAdExpenses({
          start_date: startDate,
          end_date: endDate,
        }),
      ]);

      setCurrentBalance(balanceData);
      setAdExpenses(expensesData);
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
    setStartDate(getFirstDayOfCurrentMonth());
    setEndDate(getLastDayOfCurrentMonth());
  };

  return (
    <div>
      <div className="fixed top-16 left-64 right-0 z-40 bg-white px-6 py-4 border-b border-gray-200 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance Dashboard</h1>
        <p className="text-gray-600">
          Overview of your Neobank account balance and expenses
        </p>
      </div>

      <div className="pt-[120px] px-6">
        {/* Date Range Filter */}
        <Card className="mb-6 bg-white shadow-sm">
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
                  {currentBalance ? formatCurrency(currentBalance.total_debit) : 'Rp 0'}
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
                  {currentBalance ? formatCurrency(currentBalance.total_credit) : 'Rp 0'}
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
                <p className={`text-2xl font-bold ${
                  currentBalance && currentBalance.current_balance >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {currentBalance ? formatCurrency(currentBalance.current_balance) : 'Rp 0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Net balance</p>
              </div>
            </Card>
          </div>

          {/* Ad Expenses Summary */}
          <Card className="mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Ad Expenses Summary</h2>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Ad Expense</p>
                  <p className="text-2xl font-bold text-red-600">
                    {adExpenses ? formatCurrency(adExpenses.total_ad_expense) : 'Rp 0'}
                  </p>
                </div>
              </div>

              {adExpenses && adExpenses.transactions.length > 0 ? (
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
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {adExpenses.transactions.map((transaction, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(transaction.entry_date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {transaction.entry_number}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {transaction.line_description || transaction.entry_description}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div>
                              <div className="font-medium">{transaction.partner_account_name}</div>
                              <div className="text-xs text-gray-500">{transaction.partner_account_code}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-red-600">
                            {formatCurrency(transaction.neobank_credit)}
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

          {/* All Transactions */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">All Transactions</h2>

              {currentBalance && currentBalance.transactions.length > 0 ? (
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
                      {currentBalance.transactions.map((transaction, idx) => (
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
                              <div className="font-medium">{transaction.partner_account_name}</div>
                              <div className="text-xs text-gray-500">
                                {transaction.partner_account_code} ({transaction.partner_account_type})
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                            {transaction.neobank_debit > 0 ? (
                              <span className="font-medium text-green-600">
                                {formatCurrency(transaction.neobank_debit)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                            {transaction.neobank_credit > 0 ? (
                              <span className="font-medium text-red-600">
                                {formatCurrency(transaction.neobank_credit)}
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
    </div>
  );
}

